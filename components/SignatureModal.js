// components/SignatureModal.js
"use client";

import { useRef, useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";
import SignatureCanvas from "react-signature-canvas";
import { useParams } from 'next/navigation';

export default function SignatureModal({ onClose, onSave }) {
  const sigCanvasRef = useRef(null);
  const params = useParams();
  const [name, setName] = useState("");

  // Set willReadFrequently on the canvas element to avoid performance warnings
  useEffect(() => {
    if (sigCanvasRef.current) {
      const canvas = sigCanvasRef.current.getCanvas();
      if (canvas) {
        const context = canvas.getContext('2d', { willReadFrequently: true });
      }
    }
  }, []);

  const handleSave = () => {
    if (sigCanvasRef.current) {
      // Check if signature is empty first
      if (sigCanvasRef.current.isEmpty()) {
        alert('Please provide a signature before saving.');
        return;
      }
      
      if (!name.trim()) {
        alert('Please provide your name before saving.');
        return;
      }
      
      try {
        // Get the signature canvas
        let canvas;
        if (typeof sigCanvasRef.current.getTrimmedCanvas === 'function') {
          canvas = sigCanvasRef.current.getTrimmedCanvas();
        } else {
          canvas = sigCanvasRef.current.getCanvas();
        }

        // Create a new canvas to add the name, date and contract ID
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        
        // Get current date
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // Set canvas size to accommodate all elements
        const padding = 20;
        const nameWidth = 200;
        const dateWidth = 200;
        const contractIdWidth = 150;
        newCanvas.width = Math.max(canvas.width, nameWidth + dateWidth + contractIdWidth + padding * 2);
        newCanvas.height = canvas.height + 100; // Extra height for name and date
        
        // Keep background transparent
        ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);
        
        // Draw the signature
        ctx.drawImage(canvas, 0, 40); // Move signature down to make room for name
        
        // Add the name above the signature
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Name: ${name}`, padding, 20);
        
        // Add the date to the right of the signature
        ctx.fillText(`Date: ${currentDate}`, padding, newCanvas.height - 30);
        
        // Add contract ID at the bottom
        ctx.font = '12px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`Contract ID: ${params.id}`, padding, newCanvas.height - 10);
        
        // Convert to data URL with PNG format to preserve transparency
        const dataUrl = newCanvas.toDataURL('image/png');
        
        // Pass both the signature image and the name
        onSave({
          img_url: dataUrl,
          name: name,
          date: currentDate
        });
        
      } catch (error) {
        console.error('Error saving signature with date:', error);
        // Fallback - save without date
        const dataUrl = sigCanvasRef.current.toDataURL('image/png');
        onSave({
          img_url: dataUrl,
          name: name,
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        });
      }
    }
  };

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="fixed z-20 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <DialogBackdrop className="fixed inset-0 bg-black opacity-30" />
        <DialogPanel className="relative bg-white rounded-lg max-w-md w-full p-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <DialogTitle className="text-lg font-semibold mb-4">
            Sign Here
          </DialogTitle>
          
          {/* Name Input */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          {/* Signature Canvas */}
          <div className="border-2 border-gray-200 rounded-lg mb-4 bg-white">
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                className: "rounded w-full"
              }}
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
            >
              Save
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
