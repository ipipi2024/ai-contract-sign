// app/(protected)/contracts/[id]/hooks/useContract.ts - Enhanced version with fixed types
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Contract, ContractJson, SaveStatus } from '../types/contract';
import { contractApi } from '../utils/api';

interface Signature {
  party: string;
  img_url: string;
  name?: string;
  date?: string;
  index: number;
}

interface ContractBlock {
  text: string;
  signatures: Signature[];
}

export const useContract = () => {
  const params = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [contractContent, setContractContent] = useState<any | null>(null);
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
      
      // Check if this is an uploaded document
      if (parsedContent.originalFormat) {
        // This is an uploaded document with preserved formatting
        setContractContent(parsedContent);
        
        // Convert to standard contract JSON for compatibility
        const convertedJson = convertUploadedToContractJson(parsedContent);
        setContractJson(convertedJson);
      } else {
        // Standard generated contract
        setContractJson(parsedContent);
      }
      
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

  const convertUploadedToContractJson = (uploadedContent: any): ContractJson => {
    // Convert uploaded document format to standard contract JSON
    const blocks: ContractBlock[] = [];
    const unknowns: string[] = [];
    
    // Group elements by page and convert to blocks
    const pageGroups = uploadedContent.elements.reduce((acc: any, element: any) => {
      const page = element.position?.page || 1;
      if (!acc[page]) acc[page] = [];
      acc[page].push(element);
      return acc;
    }, {});
    
    Object.values(pageGroups).forEach((pageElements: any) => {
      let currentBlock: ContractBlock = { 
        text: '', 
        signatures: [] as Signature[] 
      };
      
      pageElements.forEach((element: any, elementIndex: number) => {
        if (element.type === 'field' && element.metadata?.fieldType === 'signature') {
          // Find the field value for this signature
          const fieldValue = uploadedContent.fieldValues?.find((f: any) => 
            f.elementId === `element-${element.position.page}-${elementIndex}`
          );
          
          // Add signature to current block
          const signature: Signature = {
            party: 'PartyA', // Would need to determine this from context
            img_url: fieldValue?.value || '',
            index: currentBlock.signatures.length
          };
          
          currentBlock.signatures.push(signature);
        } else {
          // Add text content
          currentBlock.text += element.content + '\n\n';
        }
      });
      
      if (currentBlock.text.trim()) {
        blocks.push(currentBlock);
      }
    });
    
    return {
      blocks,
      unknowns,
      title: uploadedContent.metadata?.title || 'Uploaded Contract'
    };
  };

  const saveContract = async (contractData: ContractJson | any) => {
    if (!contractData) return;
    
    setSaveStatus('saving');
    
    try {
      let contentToSave;
      
      // Check if this is an uploaded document
      if (contractContent?.originalFormat) {
        // Save the full uploaded document structure
        contentToSave = JSON.stringify({
          ...contractContent,
          fieldValues: contractData.fieldValues || contractContent.fieldValues
        });
      } else {
        // Standard contract JSON
        contentToSave = JSON.stringify(contractData);
      }
      
      await contractApi.updateContract(params.id as string, {
        content: contentToSave,
      });
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving contract:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('saved'), 2000);
    }
  };

  const debouncedSave = useCallback((contractData: ContractJson | any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveContract(contractData);
    }, 500);
  }, [contractContent]);

  useEffect(() => {
    fetchContract();
  }, []);

  useEffect(() => {
    if ((contractJson || contractContent) && !isLoading) {
      debouncedSave(contractJson || contractContent);
    }
  }, [contractJson, contractContent, debouncedSave, isLoading]);

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
    contractContent,
    setContractJson,
    setContractContent,
    isLoading,
    saveStatus,
    error,
    setError,
    setContract
  };
};