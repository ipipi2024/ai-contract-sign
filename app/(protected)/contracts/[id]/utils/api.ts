import { ContractJson } from '../types/contract';

export const contractApi = {
  async fetchContract(id: string) {
    const response = await fetch(`/api/contracts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch contract');
    return response.json();
  },

  async updateContract(id: string, data: any) {
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update contract');
    return response.json();
  },

  async sendContract(id: string, contractJson: ContractJson, recipientEmail: string) {
    const response = await fetch(`/api/contracts/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractJson, recipientEmail }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send contract');
    }
    return response.json();
  },

  async generatePDF(id: string, contractJson: ContractJson) {
    const response = await fetch(`/api/contracts/${id}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractJson }),
    });
    if (!response.ok) throw new Error('Failed to generate PDF');
    return response.blob();
  },

  async regenerateBlock(contractJson: ContractJson, blockIndex: number, userPrompt: string) {
    const response = await fetch("/api/regenerateBlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractJson, blockIndex, userPrompt }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to regenerate block");
    }
    return response.json();
  }
};

export const chatApi = {
  async sendMessage(message: string, contractJson: ContractJson, chatHistory: any[], options?: any) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        contractJson,
        chatHistory,
        ...options
      }),
    });
    if (!response.ok) throw new Error('Failed to send chat message');
    return response.json();
  },

  async regenerateContract(contractJson: ContractJson, userPrompt: string) {
    const response = await fetch("/api/regenerateContract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractJson, userPrompt }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to regenerate contract');
    }
    return response.json();
  }
};