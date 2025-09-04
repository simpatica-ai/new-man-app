// src/components/JournalEntryCard.tsx
"use client";

import React, { useState } from 'react';
import TiptapEditor from '@/components/Editor';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';
import { Edit, Trash2 } from 'lucide-react';

type JournalEntryCardProps = {
  entry: {
    id: number;
    date: string;
    content: string; // This is expected to be HTML
  };
  onUpdate: (entryId: number, newContent: string) => Promise<void>;
  onDelete: (entryId: number) => Promise<void>;
};

export default function JournalEntryCard({ entry, onUpdate, onDelete }: JournalEntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(entry.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(entry.id, editedContent);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(entry.content); // Revert changes
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      setIsSaving(true); // Disable buttons during delete
      await onDelete(entry.id);
      // No need to set isSaving back to false, as the component will be removed from the list
    }
  };

  // Sanitize HTML content before rendering
  const sanitizedContent = DOMPurify.sanitize(entry.content);

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-stone-200">
      {isEditing ? (
        <div className="space-y-4">
          <TiptapEditor
            content={editedContent}
            onChange={(html) => setEditedContent(html)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-stone-700">Entry from {entry.date}</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} disabled={isSaving}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isSaving} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      )}
    </div>
  );
}