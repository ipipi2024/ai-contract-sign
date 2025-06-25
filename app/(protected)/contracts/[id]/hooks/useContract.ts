import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Contract, ContractJson, SaveStatus } from '../types/contract';
import { contractApi } from '../utils/api';

export const useContract = () => {
  const params = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContract = async () => {
    try {
      const data = await contractApi.fetchContract(params.id as string);
      setContract(data.contract);
      
      let parsedContent;
      if (typeof data.contract.content === 'string') {
        parsedContent = JSON.parse(data.contract.content);
      } else {
        parsedContent = data.contract.content;
      }
      setContractJson(parsedContent);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError({
        title: "Error",
        message: "Failed to load contract. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveContract = async (contractData: ContractJson) => {
    if (!contractData) return;
    
    setSaveStatus('saving');
    
    try {
      await contractApi.updateContract(params.id as string, {
        content: JSON.stringify(contractData),
      });
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving contract:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('saved'), 2000);
    }
  };

  const debouncedSave = useCallback((contractData: ContractJson) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveContract(contractData);
    }, 500);
  }, []);

  useEffect(() => {
    fetchContract();
  }, []);

  useEffect(() => {
    if (contractJson && !isLoading) {
      debouncedSave(contractJson);
    }
  }, [contractJson, debouncedSave, isLoading]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    contract,
    contractJson,
    setContractJson,
    isLoading,
    saveStatus,
    error,
    setError,
    setContract
  };
};