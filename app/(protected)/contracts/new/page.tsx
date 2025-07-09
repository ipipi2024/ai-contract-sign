"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { server_log } from "@/app/actions/log";
import FileUploadZone from "@/components/FileUploadZone";
import AttachmentList from "@/components/AttachmentList";
import { parseDocument } from "@/lib/documentParser";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Wand2,
  Type,
  Calendar,
  Pen,
  Hash,
  CheckSquare,
  Circle,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Mail,
  User,
  Edit3,
  Square,
  Trash2,
  Settings,
  X,
  Plus,
  Minus,
} from "lucide-react";

// Field types enum (matching Documenso's)
enum FieldType {
  SIGNATURE = "SIGNATURE",
  INITIALS = "INITIALS",
  TEXT = "TEXT",
  DATE = "DATE",
  EMAIL = "EMAIL",
  NAME = "NAME",
  NUMBER = "NUMBER",
  CHECKBOX = "CHECKBOX",
  RADIO = "RADIO",
  DROPDOWN = "DROPDOWN",
}

// Field meta interfaces (matching Documenso's field-meta types)
interface TextFieldMeta {
  type: "TEXT";
  text?: string;
  required?: boolean;
  readOnly?: boolean;
  characterLimit?: number;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

interface NumberFieldMeta {
  type: "NUMBER";
  value?: number;
  required?: boolean;
  readOnly?: boolean;
  minValue?: number;
  maxValue?: number;
  numberFormat?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

interface DateFieldMeta {
  type: "DATE";
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

interface EmailFieldMeta {
  type: "EMAIL";
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

interface NameFieldMeta {
  type: "NAME";
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

interface InitialsFieldMeta {
  type: "INITIALS";
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

interface CheckboxFieldMeta {
  type: "CHECKBOX";
  required?: boolean;
  readOnly?: boolean;
  values?: Array<{ id: string; value: string; checked?: boolean }>;
  validationRule?: string;
  validationLength?: number;
}

interface RadioFieldMeta {
  type: "RADIO";
  required?: boolean;
  readOnly?: boolean;
  values?: Array<{ id: string; value: string; checked?: boolean }>;
}

interface DropdownFieldMeta {
  type: "DROPDOWN";
  required?: boolean;
  readOnly?: boolean;
  defaultValue?: string;
  values?: Array<{ id: string; value: string }>;
  fontSize?: number;
}

type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | DateFieldMeta
  | EmailFieldMeta
  | NameFieldMeta
  | InitialsFieldMeta
  | CheckboxFieldMeta
  | RadioFieldMeta
  | DropdownFieldMeta;

// Field interface (matching Documenso's structure)
interface Field {
  id: string;
  type: FieldType;
  recipientEmail: string;
  pageNumber: number;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
  fieldMeta?: FieldMeta;
}

// Recipient interface
interface Recipient {
  id: string;
  name: string;
  email: string;
  role: "SIGNER" | "VIEWER" | "APPROVER";
}

// Helper function to create default field meta
const createDefaultFieldMeta = (type: FieldType): FieldMeta | undefined => {
  switch (type) {
    case FieldType.TEXT:
      return {
        type: "TEXT",
        required: false,
        readOnly: false,
        fontSize: 14,
        textAlign: "left",
      };
    case FieldType.NUMBER:
      return {
        type: "NUMBER",
        required: false,
        readOnly: false,
        fontSize: 14,
        textAlign: "left",
      };
    case FieldType.DATE:
      return {
        type: "DATE",
        required: false,
        readOnly: false,
        fontSize: 14,
        textAlign: "left",
      };
    case FieldType.EMAIL:
      return {
        type: "EMAIL",
        required: false,
        readOnly: false,
        fontSize: 14,
        textAlign: "left",
      };
    case FieldType.NAME:
      return {
        type: "NAME",
        required: false,
        readOnly: false,
        fontSize: 14,
        textAlign: "left",
      };
    case FieldType.INITIALS:
      return {
        type: "INITIALS",
        required: false,
        readOnly: false,
        fontSize: 14,
        textAlign: "left",
      };
    case FieldType.CHECKBOX:
      return {
        type: "CHECKBOX",
        required: false,
        readOnly: false,
        values: [{ id: "1", value: "Option 1" }],
      };
    case FieldType.RADIO:
      return {
        type: "RADIO",
        required: false,
        readOnly: false,
        values: [{ id: "1", value: "Option 1" }],
      };
    case FieldType.DROPDOWN:
      return {
        type: "DROPDOWN",
        required: false,
        readOnly: false,
        values: [{ id: "1", value: "Option 1" }],
        fontSize: 14,
      };
    default:
      return undefined;
  }
};

// Document viewer component
interface DocumentViewerProps {
  file: File | null;
  fields: Field[];
  recipients: Recipient[];
  onFieldsChange: (fields: Field[]) => void;
  selectedFieldType: FieldType;
}

const DocumentViewer = ({
  file,
  fields,
  recipients,
  onFieldsChange,
  selectedFieldType,
}: DocumentViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<Field | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPlacingField, setIsPlacingField] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>(
    recipients[0]?.email || ""
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    if (
      recipients.length > 0 &&
      !recipients.find((r) => r.email === selectedRecipient)
    ) {
      setSelectedRecipient(recipients[0].email);
    }
  }, [recipients, selectedRecipient]);

  const handleFieldMouseDown = (e: React.MouseEvent, field: Field) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const handleSize = 8;
    const isNearRight = x > rect.width - handleSize;
    const isNearBottom = y > rect.height - handleSize;

    if (isNearRight || isNearBottom) {
      setIsResizing(true);
      setResizeDirection(
        isNearRight && isNearBottom ? "se" : isNearRight ? "e" : "s"
      );
    } else {
      setIsDragging(true);
    }

    setDraggedField(field);
    setSelectedField(field);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setMousePosition({
        x: e.clientX - containerRect.left - field.pageX * pageScale,
        y: e.clientY - containerRect.top - field.pageY * pageScale,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedField || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const scrollLeft = containerRef.current.scrollLeft;

    if (isDragging) {
      const newX =
        (e.clientX - rect.left - mousePosition.x + scrollLeft) / pageScale;
      const newY =
        (e.clientY - rect.top - mousePosition.y + scrollTop) / pageScale;

      const updatedFields = fields.map((f) =>
        f.id === draggedField.id
          ? { ...f, pageX: Math.max(0, newX), pageY: Math.max(0, newY) }
          : f
      );
      onFieldsChange(updatedFields);
    } else if (isResizing) {
      const mouseX = (e.clientX - rect.left + scrollLeft) / pageScale;
      const mouseY = (e.clientY - rect.top + scrollTop) / pageScale;

      const updatedFields = fields.map((f) => {
        if (f.id === draggedField.id) {
          let newWidth = f.pageWidth;
          let newHeight = f.pageHeight;

          if (resizeDirection.includes("e")) {
            newWidth = Math.max(50, mouseX - f.pageX);
          }
          if (resizeDirection.includes("s")) {
            newHeight = Math.max(20, mouseY - f.pageY);
          }

          return { ...f, pageWidth: newWidth, pageHeight: newHeight };
        }
        return f;
      });
      onFieldsChange(updatedFields);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection("");
    setDraggedField(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isPlacingField || !overlayRef.current || !selectedRecipient) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current?.scrollTop || 0;
    const scrollLeft = containerRef.current?.scrollLeft || 0;

    const x = (e.clientX - rect.left + scrollLeft) / pageScale;
    const y = (e.clientY - rect.top + scrollTop) / pageScale;

    // Default sizes for different field types
    const defaultSizes = {
      [FieldType.SIGNATURE]: { width: 200, height: 60 },
      [FieldType.INITIALS]: { width: 100, height: 40 },
      [FieldType.TEXT]: { width: 150, height: 30 },
      [FieldType.DATE]: { width: 120, height: 30 },
      [FieldType.EMAIL]: { width: 200, height: 30 },
      [FieldType.NAME]: { width: 150, height: 30 },
      [FieldType.NUMBER]: { width: 100, height: 30 },
      [FieldType.CHECKBOX]: { width: 150, height: 100 },
      [FieldType.RADIO]: { width: 150, height: 100 },
      [FieldType.DROPDOWN]: { width: 150, height: 30 },
    };

    const size = defaultSizes[selectedFieldType];

    const newField: Field = {
      id: `field-${Date.now()}`,
      type: selectedFieldType,
      recipientEmail: selectedRecipient,
      pageNumber: 1, // For now, assuming single page
      pageX: x - size.width / 2,
      pageY: y - size.height / 2,
      pageWidth: size.width,
      pageHeight: size.height,
      fieldMeta: createDefaultFieldMeta(selectedFieldType),
    };

    onFieldsChange([...fields, newField]);
    setSelectedField(newField);
    setIsPlacingField(false);
  };

  const handleFieldDelete = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
    setSelectedField(null);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    onFieldsChange(
      fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case FieldType.SIGNATURE:
        return <Pen className="h-3 w-3" />;
      case FieldType.INITIALS:
        return <Edit3 className="h-3 w-3" />;
      case FieldType.TEXT:
        return <Type className="h-3 w-3" />;
      case FieldType.DATE:
        return <Calendar className="h-3 w-3" />;
      case FieldType.EMAIL:
        return <Mail className="h-3 w-3" />;
      case FieldType.NAME:
        return <User className="h-3 w-3" />;
      case FieldType.NUMBER:
        return <Hash className="h-3 w-3" />;
      case FieldType.CHECKBOX:
        return <CheckSquare className="h-3 w-3" />;
      case FieldType.RADIO:
        return <Circle className="h-3 w-3" />;
      case FieldType.DROPDOWN:
        return <ChevronDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRecipientColor = (email: string) => {
    const index = recipients.findIndex((r) => r.email === email);
    const colors = [
      { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
      { border: "border-green-500", bg: "bg-green-50", text: "text-green-700" },
      {
        border: "border-purple-500",
        bg: "bg-purple-50",
        text: "text-purple-700",
      },
      {
        border: "border-orange-500",
        bg: "bg-orange-50",
        text: "text-orange-700",
      },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex gap-4 h-[700px]">
      {/* Document Preview */}
      <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select
              value={selectedRecipient}
              onValueChange={setSelectedRecipient}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients
                  .filter(
                    (recipient) =>
                      recipient.email && recipient.email.trim() !== ""
                  )
                  .map((recipient) => (
                    <SelectItem key={recipient.email} value={recipient.email}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getRecipientColor(
                            recipient.email
                          ).bg.replace("bg-", "bg-opacity-100 bg-")}`}
                        />
                        {recipient.name} ({recipient.email})
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setIsPlacingField(!isPlacingField)}
              variant={isPlacingField ? "default" : "outline"}
              size="sm"
            >
              {isPlacingField ? "Click to place field" : "Add Field"}
            </Button>

            {isPlacingField && (
              <span className="text-sm text-gray-500">
                Click on the document to place a{" "}
                {selectedFieldType.toLowerCase()} field
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageScale(Math.max(0.5, pageScale - 0.1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(pageScale * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageScale(Math.min(2, pageScale + 0.1))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document Container */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto bg-gray-100"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {pdfUrl ? (
            <div
              className="relative"
              style={{
                transform: `scale(${pageScale})`,
                transformOrigin: "top left",
              }}
            >
              {/* PDF Embed */}
              <object
                data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                type="application/pdf"
                className="w-full"
                style={{
                  minHeight: "800px",
                  height: "auto",
                  pointerEvents: isPlacingField ? "none" : "auto",
                }}
              >
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full"
                  style={{
                    minHeight: "800px",
                    height: "auto",
                    pointerEvents: isPlacingField ? "none" : "auto",
                  }}
                  title="PDF Preview"
                />
              </object>

              {/* Transparent overlay for capturing clicks when placing fields */}
              {isPlacingField && (
                <div
                  ref={overlayRef}
                  className="absolute inset-0 z-20 cursor-crosshair"
                  onClick={handleOverlayClick}
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                />
              )}

              {/* Fields overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {fields.map((field) => {
                  const colors = getRecipientColor(field.recipientEmail);
                  return (
                    <div
                      key={field.id}
                      className={`absolute border-2 rounded flex items-center justify-center pointer-events-auto group
                        ${colors.border} ${colors.bg}
                        ${
                          selectedField?.id === field.id
                            ? "ring-2 ring-offset-1 ring-blue-500"
                            : ""
                        }
                        hover:shadow-lg transition-all opacity-90`}
                      style={{
                        left: `${field.pageX}px`,
                        top: `${field.pageY}px`,
                        width: `${field.pageWidth}px`,
                        height: `${field.pageHeight}px`,
                        cursor:
                          isDragging && draggedField?.id === field.id
                            ? "move"
                            : isResizing && draggedField?.id === field.id
                            ? resizeDirection === "se"
                              ? "nwse-resize"
                              : resizeDirection === "e"
                              ? "ew-resize"
                              : "s-resize"
                            : "move",
                      }}
                      onMouseDown={(e) => handleFieldMouseDown(e, field)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedField(field);
                      }}
                    >
                      <div
                        className={`flex items-center gap-1 text-xs pointer-events-none select-none ${colors.text}`}
                      >
                        {getFieldIcon(field.type)}
                        <span className="font-medium">{field.type}</span>
                      </div>

                      {/* Delete button */}
                      <button
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFieldDelete(field.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Resize handles */}
                      {selectedField?.id === field.id && (
                        <>
                          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize" />
                          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize" />
                          <div className="absolute right-0 bottom-0 w-2 h-2 cursor-nwse-resize" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Upload a PDF to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Field Properties Panel */}
      {selectedField && (
        <FieldPropertiesPanel
          field={selectedField}
          onUpdate={(updates) => handleFieldUpdate(selectedField.id, updates)}
          onDelete={() => handleFieldDelete(selectedField.id)}
          recipients={recipients}
        />
      )}
    </div>
  );
};

// Field Properties Panel Component
interface FieldPropertiesPanelProps {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
  recipients: Recipient[];
}

const FieldPropertiesPanel = ({
  field,
  onUpdate,
  onDelete,
  recipients,
}: FieldPropertiesPanelProps) => {
  const updateFieldMeta = (updates: Partial<FieldMeta>) => {
    onUpdate({
      fieldMeta: { ...field.fieldMeta, ...updates } as FieldMeta,
    });
  };

  return (
    <div className="w-80 bg-white border rounded-lg p-4 space-y-4 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Field Properties
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        {/* Field Type */}
        <div>
          <Label className="text-sm font-medium">Type</Label>
          <p className="text-sm text-gray-600 capitalize">
            {field.type.toLowerCase()}
          </p>
        </div>

        {/* Recipient */}
        <div>
          <Label className="text-sm font-medium">Recipient</Label>
          <Select
            value={field.recipientEmail}
            onValueChange={(email) => onUpdate({ recipientEmail: email })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recipients
                .filter(
                  (recipient) =>
                    recipient.email && recipient.email.trim() !== ""
                )
                .map((recipient) => (
                  <SelectItem key={recipient.email} value={recipient.email}>
                    {recipient.name} ({recipient.email})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div>
          <Label className="text-sm font-medium">Position</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <Label className="text-xs text-gray-500">X</Label>
              <Input
                type="number"
                value={Math.round(field.pageX)}
                onChange={(e) =>
                  onUpdate({ pageX: parseInt(e.target.value) || 0 })
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Y</Label>
              <Input
                type="number"
                value={Math.round(field.pageY)}
                onChange={(e) =>
                  onUpdate({ pageY: parseInt(e.target.value) || 0 })
                }
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <Label className="text-sm font-medium">Size</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <Label className="text-xs text-gray-500">Width</Label>
              <Input
                type="number"
                value={Math.round(field.pageWidth)}
                onChange={(e) =>
                  onUpdate({ pageWidth: parseInt(e.target.value) || 100 })
                }
                className="h-8"
                min="50"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Height</Label>
              <Input
                type="number"
                value={Math.round(field.pageHeight)}
                onChange={(e) =>
                  onUpdate({ pageHeight: parseInt(e.target.value) || 30 })
                }
                className="h-8"
                min="20"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Field-specific properties */}
        {renderFieldSpecificProperties(field, updateFieldMeta)}
      </div>
    </div>
  );
};

// Helper function to render field-specific properties
const renderFieldSpecificProperties = (
  field: Field,
  updateFieldMeta: (updates: Partial<FieldMeta>) => void
) => {
  const meta = field.fieldMeta;

  // Common properties for most fields
  const renderCommonProperties = () => (
    <>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Required</Label>
        <Switch
          checked={meta?.required || false}
          onCheckedChange={(checked) => updateFieldMeta({ required: checked })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Read Only</Label>
        <Switch
          checked={meta?.readOnly || false}
          onCheckedChange={(checked) => updateFieldMeta({ readOnly: checked })}
        />
      </div>
    </>
  );

  // Text alignment for text-based fields
  const renderTextAlignment = () => {
    if (!("textAlign" in (meta || {}))) return null;

    return (
      <div>
        <Label className="text-sm font-medium">Text Alignment</Label>
        <div className="flex gap-1 mt-1">
          <Button
            variant={
              meta?.textAlign === "left" || !meta?.textAlign
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => updateFieldMeta({ textAlign: "left" })}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={meta?.textAlign === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFieldMeta({ textAlign: "center" })}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={meta?.textAlign === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFieldMeta({ textAlign: "right" })}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Font size for text-based fields
  const renderFontSize = () => {
    if (!("fontSize" in (meta || {}))) return null;

    return (
      <div>
        <Label className="text-sm font-medium">Font Size</Label>
        <Input
          type="number"
          value={meta?.fontSize || 14}
          onChange={(e) =>
            updateFieldMeta({ fontSize: parseInt(e.target.value) || 14 })
          }
          className="h-8 mt-1"
          min="8"
          max="24"
        />
      </div>
    );
  };

  switch (field.type) {
    case FieldType.TEXT:
      const textMeta = meta as TextFieldMeta | undefined;
      return (
        <>
          {renderCommonProperties()}
          <div>
            <Label className="text-sm font-medium">Character Limit</Label>
            <Input
              type="number"
              value={textMeta?.characterLimit || ""}
              onChange={(e) =>
                updateFieldMeta({
                  characterLimit: parseInt(e.target.value) || undefined,
                })
              }
              className="h-8 mt-1"
              placeholder="No limit"
              min="1"
            />
          </div>
          {renderFontSize()}
          {renderTextAlignment()}
        </>
      );

    case FieldType.NUMBER:
      const numberMeta = meta as NumberFieldMeta | undefined;
      return (
        <>
          {renderCommonProperties()}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm font-medium">Min Value</Label>
              <Input
                type="number"
                value={numberMeta?.minValue || ""}
                onChange={(e) =>
                  updateFieldMeta({
                    minValue: parseInt(e.target.value) || undefined,
                  })
                }
                className="h-8 mt-1"
                placeholder="No minimum"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Max Value</Label>
              <Input
                type="number"
                value={numberMeta?.maxValue || ""}
                onChange={(e) =>
                  updateFieldMeta({
                    maxValue: parseInt(e.target.value) || undefined,
                  })
                }
                className="h-8 mt-1"
                placeholder="No maximum"
              />
            </div>
          </div>
          {renderFontSize()}
          {renderTextAlignment()}
        </>
      );

    case FieldType.CHECKBOX:
      const checkboxMeta = meta as CheckboxFieldMeta | undefined;
      const checkboxValues = checkboxMeta?.values || [{ id: "1", value: "" }];

      return (
        <>
          {renderCommonProperties()}
          <div>
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-2 mt-2">
              {checkboxValues.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    value={item.value}
                    onChange={(e) => {
                      const newValues = [...checkboxValues];
                      newValues[index] = { ...item, value: e.target.value };
                      updateFieldMeta({ values: newValues });
                    }}
                    className="h-8"
                    placeholder="Option text"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValues = checkboxValues.filter(
                        (_, i) => i !== index
                      );
                      updateFieldMeta({ values: newValues });
                    }}
                    disabled={checkboxValues.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newValues = [
                    ...checkboxValues,
                    { id: Date.now().toString(), value: "" },
                  ];
                  updateFieldMeta({ values: newValues });
                }}
                className="w-full"
              >
                Add Option
              </Button>
            </div>
          </div>
        </>
      );

    case FieldType.RADIO:
      const radioMeta = meta as RadioFieldMeta | undefined;
      const radioValues = radioMeta?.values || [{ id: "1", value: "" }];

      return (
        <>
          {renderCommonProperties()}
          <div>
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-2 mt-2">
              {radioValues.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    value={item.value}
                    onChange={(e) => {
                      const newValues = [...radioValues];
                      newValues[index] = { ...item, value: e.target.value };
                      updateFieldMeta({ values: newValues });
                    }}
                    className="h-8"
                    placeholder="Option text"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValues = radioValues.filter(
                        (_, i) => i !== index
                      );
                      updateFieldMeta({ values: newValues });
                    }}
                    disabled={radioValues.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newValues = [
                    ...radioValues,
                    { id: Date.now().toString(), value: "" },
                  ];
                  updateFieldMeta({ values: newValues });
                }}
                className="w-full"
              >
                Add Option
              </Button>
            </div>
          </div>
        </>
      );

    case FieldType.DROPDOWN:
      const dropdownMeta = meta as DropdownFieldMeta | undefined;
      const dropdownValues = dropdownMeta?.values || [{ id: "1", value: "" }];

      return (
        <>
          {renderCommonProperties()}
          <div>
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-2 mt-2">
              {dropdownValues.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    value={item.value}
                    onChange={(e) => {
                      const newValues = [...dropdownValues];
                      newValues[index] = { ...item, value: e.target.value };
                      updateFieldMeta({ values: newValues });
                    }}
                    className="h-8"
                    placeholder="Option text"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValues = dropdownValues.filter(
                        (_, i) => i !== index
                      );
                      updateFieldMeta({ values: newValues });
                    }}
                    disabled={dropdownValues.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newValues = [
                    ...dropdownValues,
                    { id: Date.now().toString(), value: "" },
                  ];
                  updateFieldMeta({ values: newValues });
                }}
                className="w-full"
              >
                Add Option
              </Button>
            </div>
          </div>
          {renderFontSize()}
        </>
      );

    case FieldType.DATE:
    case FieldType.EMAIL:
    case FieldType.NAME:
    case FieldType.INITIALS:
      return (
        <>
          {renderCommonProperties()}
          {renderFontSize()}
          {renderTextAlignment()}
        </>
      );

    case FieldType.SIGNATURE:
      return (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Required</Label>
            <Switch
              checked={meta?.required || false}
              onCheckedChange={(checked) =>
                updateFieldMeta({ required: checked })
              }
            />
          </div>
        </>
      );

    default:
      return null;
  }
};

// Field toolbar component
interface FieldToolbarProps {
  selectedType: FieldType;
  onTypeSelect: (type: FieldType) => void;
}

const FieldToolbar = ({ selectedType, onTypeSelect }: FieldToolbarProps) => {
  const fieldTypes = [
    { type: FieldType.SIGNATURE, icon: Pen, label: "Signature" },
    { type: FieldType.INITIALS, icon: Edit3, label: "Initials" },
    { type: FieldType.TEXT, icon: Type, label: "Text" },
    { type: FieldType.DATE, icon: Calendar, label: "Date" },
    { type: FieldType.EMAIL, icon: Mail, label: "Email" },
    { type: FieldType.NAME, icon: User, label: "Name" },
    { type: FieldType.NUMBER, icon: Hash, label: "Number" },
    { type: FieldType.CHECKBOX, icon: CheckSquare, label: "Checkbox" },
    { type: FieldType.RADIO, icon: Circle, label: "Radio" },
    { type: FieldType.DROPDOWN, icon: ChevronDown, label: "Dropdown" },
  ];

  return (
    <div className="flex gap-2 p-4 bg-gray-50 rounded-lg flex-wrap">
      {fieldTypes.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          onClick={() => onTypeSelect(type)}
          variant={selectedType === type ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
};

// Recipients management component
interface RecipientsManagerProps {
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
}

const RecipientsManager = ({
  recipients,
  onRecipientsChange,
}: RecipientsManagerProps) => {
  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: `recipient-${Date.now()}`,
      name: "",
      email: "",
      role: "SIGNER",
    };
    onRecipientsChange([...recipients, newRecipient]);
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    onRecipientsChange(
      recipients.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const removeRecipient = (id: string) => {
    onRecipientsChange(recipients.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recipients</h3>
        <Button onClick={addRecipient} size="sm">
          Add Recipient
        </Button>
      </div>

      <div className="space-y-3">
        {recipients.map((recipient, index) => {
          const recipientFields = recipients.filter(
            (r) => r.email === recipient.email
          );
          const recipientColor =
            index % 4 === 0
              ? "blue"
              : index % 4 === 1
              ? "green"
              : index % 4 === 2
              ? "purple"
              : "orange";

          return (
            <div key={recipient.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-${recipientColor}-500`}
                  />
                  <span className="text-sm font-medium">
                    Recipient {index + 1}
                  </span>
                </div>
                {recipients.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipient(recipient.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={recipient.name}
                    onChange={(e) =>
                      updateRecipient(recipient.id, { name: e.target.value })
                    }
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    value={recipient.email}
                    onChange={(e) =>
                      updateRecipient(recipient.id, { email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Role</Label>
                <Select
                  value={recipient.role}
                  onValueChange={(role) =>
                    updateRecipient(recipient.id, {
                      role: role as Recipient["role"],
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIGNER">Signer</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="APPROVER">Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Error Modal component
interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorModal = ({ isOpen, onClose, title, message }: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="relative bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// Attachment interface
interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  loading?: boolean;
  error?: string;
}

// Main component
export default function NewContractPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null
  );

  // AI Generation state
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentFields, setDocumentFields] = useState<Field[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "recipient-1", name: "", email: "", role: "SIGNER" },
  ]);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>(
    FieldType.SIGNATURE
  );
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const SUPPORTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "text/markdown",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  // AI Generation handlers
  const handleFileSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        setError({
          title: "Unsupported File Type",
          message: `"${file.name}" is not a supported file type. Please upload PDF, DOCX, TXT, MD, JPG, or PNG files.`,
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError({
          title: "File Too Large",
          message: `"${file.name}" exceeds the 10MB file size limit.`,
        });
        continue;
      }

      const attachment: Attachment = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        loading: true,
      };

      setAttachments((prev) => [...prev, attachment]);

      try {
        const content = await parseDocument(file);

        setAttachments((prev) =>
          prev.map((att) =>
            att.id === attachment.id ? { ...att, content, loading: false } : att
          )
        );
      } catch (error) {
        setAttachments((prev) =>
          prev.map((att) =>
            att.id === attachment.id
              ? { ...att, loading: false, error: "Failed to parse document" }
              : att
          )
        );
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");

    if (pastedText.length > 1000) {
      e.preventDefault();

      const attachment: Attachment = {
        id: `paste-${Date.now()}`,
        name: `Pasted content ${new Date().toLocaleTimeString()}.txt`,
        size: new Blob([pastedText]).size,
        type: "text/plain",
        content: pastedText,
      };

      setAttachments((prev) => [...prev, attachment]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const buildCombinedPrompt = () => {
    let combinedPrompt = prompt.trim();

    if (attachments.length > 0) {
      combinedPrompt += "\n\n--- Attached Documents ---\n\n";

      attachments.forEach((attachment, index) => {
        if (attachment.content && !attachment.error) {
          combinedPrompt += `Document ${index + 1}: ${attachment.name}\n`;
          combinedPrompt += "---\n";
          combinedPrompt += attachment.content;
          combinedPrompt += "\n\n";
        }
      });
    }

    return combinedPrompt;
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasValidAttachments = attachments.some(
      (att) => att.content && !att.error
    );

    if (!prompt.trim() && !hasValidAttachments) {
      setError({
        title: "Missing Description",
        message:
          "Please enter a description of the contract you need or upload relevant documents.",
      });
      return;
    }

    if (attachments.some((att) => att.loading)) {
      setError({
        title: "Files Still Processing",
        message:
          "Please wait for all files to finish processing before generating the contract.",
      });
      return;
    }

    setLoading(true);

    try {
      const combinedPrompt = buildCombinedPrompt();

      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: combinedPrompt,
        }),
      });

      if (response.ok) {
        const { contract } = await response.json();
        server_log(contract);
        router.push(`/contracts/${contract._id}`);
      } else {
        const errorData = await response.json();
        setError({
          title: "Contract Generation Failed",
          message:
            errorData.message ||
            "Failed to generate contract. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setError({
        title: "Error",
        message:
          "An error occurred while generating the contract. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Document Upload handlers
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setDocumentFields([]); // Reset fields when new document is uploaded
    } else {
      setError({
        title: "Invalid File Type",
        message: "Please upload a PDF file for field placement.",
      });
    }
  };

  const validateRecipients = (): boolean => {
    for (const recipient of recipients) {
      if (!recipient.name.trim()) {
        setError({
          title: "Invalid Recipient",
          message: "Please enter a name for all recipients.",
        });
        return false;
      }
      if (
        !recipient.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)
      ) {
        setError({
          title: "Invalid Email",
          message: "Please enter a valid email address for all recipients.",
        });
        return false;
      }
    }
    return true;
  };

  const handleDocumentSubmit = async () => {
    if (!uploadedFile) {
      setError({
        title: "No Document",
        message: "Please upload a document first.",
      });
      return;
    }

    if (!validateRecipients()) {
      return;
    }

    if (documentFields.length === 0) {
      setError({
        title: "No Fields",
        message: "Please add at least one field to the document.",
      });
      return;
    }

    // Validate that each recipient has at least one field
    const recipientEmails = new Set(recipients.map((r) => r.email));
    const fieldRecipientEmails = new Set(
      documentFields.map((f) => f.recipientEmail)
    );

    for (const email of recipientEmails) {
      if (!fieldRecipientEmails.has(email)) {
        setError({
          title: "Missing Fields",
          message: `Recipient ${email} has no fields assigned. Please add at least one field for each recipient.`,
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Transform fields to match Documenso's API format
      const transformedFields = documentFields.map((field) => ({
        type: field.type,
        recipientEmail: field.recipientEmail,
        pageNumber: field.pageNumber,
        pageX: field.pageX,
        pageY: field.pageY,
        pageWidth: field.pageWidth,
        pageHeight: field.pageHeight,
        fieldMeta: field.fieldMeta,
      }));

      // Create form data to send document and fields
      const formData = new FormData();
      formData.append("document", uploadedFile);
      formData.append("recipients", JSON.stringify(recipients));
      formData.append("fields", JSON.stringify(transformedFields));

      const response = await fetch("/api/contracts/upload-with-fields", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { contract } = await response.json();
        server_log(contract);
        router.push(`/contracts/${contract._id}`);
      } else {
        const errorData = await response.json();
        setError({
          title: "Document Processing Failed",
          message:
            errorData.message ||
            "Failed to process document. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setError({
        title: "Error",
        message:
          "An error occurred while processing the document. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Contract
            </h1>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Generate with AI
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Document
              </TabsTrigger>
            </TabsList>

            {/* AI Generation Tab */}
            <TabsContent value="generate">
              <form
                onSubmit={handleAISubmit}
                className="bg-white rounded-lg shadow-md p-6 space-y-6"
              >
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe Your Contract
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onPaste={handlePaste}
                      className="w-full min-h-[160px] resize-none"
                      placeholder="Create a freelance contract between ABC Corp and John Smith for website development. $5,000 payment in two milestones, 6-week timeline, includes hosting setup and training."
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Attach files"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-2 flex justify-between items-center">
                    <span>{prompt.length} characters</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Upload files
                      </button>
                      <span className="text-gray-400">•</span>
                      <span>PDF, DOCX, TXT, Images</span>
                    </div>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <AttachmentList
                    attachments={attachments}
                    onRemove={removeAttachment}
                  />
                )}

                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  fileInputRef={fileInputRef}
                  attachments={attachments}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    e.target.files && handleFileSelect(e.target.files)
                  }
                  className="hidden"
                />

                <div className="flex justify-end space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </Link>
                  <Button
                    type="submit"
                    disabled={
                      loading || (!prompt.trim() && attachments.length === 0)
                    }
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating Contract...
                      </span>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Document Upload Tab */}
            <TabsContent value="upload">
              <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                {/* Upload Area */}
                {!uploadedFile ? (
                  <div
                    onClick={() => uploadFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload a PDF document
                    </p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                    <input
                      ref={uploadFileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <>
                    {/* Document info */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-600" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setUploadedFile(null);
                          setDocumentFields([]);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Recipients Manager */}
                    <RecipientsManager
                      recipients={recipients}
                      onRecipientsChange={setRecipients}
                    />

                    {/* Field Toolbar */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Add Fields</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Select a field type below, then click "Add Field" and
                        click on the document to place it. You can drag fields
                        to reposition them and resize them by dragging the
                        edges.
                      </p>
                      <FieldToolbar
                        selectedType={selectedFieldType}
                        onTypeSelect={setSelectedFieldType}
                      />
                    </div>

                    {/* Document Viewer */}
                    <DocumentViewer
                      file={uploadedFile}
                      fields={documentFields}
                      recipients={recipients}
                      onFieldsChange={setDocumentFields}
                      selectedFieldType={selectedFieldType}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-4">
                      <Link
                        href="/dashboard"
                        className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </Link>
                      <Button
                        onClick={handleDocumentSubmit}
                        disabled={loading || documentFields.length === 0}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing Document...
                          </span>
                        ) : (
                          "Save Contract"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title={error?.title || ""}
        message={error?.message || ""}
      />
    </>
  );
}
