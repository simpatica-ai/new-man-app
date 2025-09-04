// src/components/JournalEntryCard.tsx
"use client";

import React, { useState } from 'react';
import TiptapEditor from '@/components/Editor';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
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
