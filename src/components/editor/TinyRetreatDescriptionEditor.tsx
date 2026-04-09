'use client';

import { Editor } from '@tinymce/tinymce-react';

function tinyApiKey(): string {
  const k = process.env.NEXT_PUBLIC_TINYMCE_API_KEY?.trim();
  return k || 'no-api-key';
}

interface Props {
  id: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TinyRetreatDescriptionEditor({ id, value, onChange, disabled, placeholder }: Props) {
  return (
    <div className="rounded-xl border border-sand-200 overflow-hidden bg-white [&_.tox-tinymce]:border-0 [&_.tox-tinymce]:rounded-xl">
      <Editor
        id={id}
        apiKey={tinyApiKey()}
        value={value}
        onEditorChange={(html) => onChange(html)}
        disabled={disabled}
        init={{
          height: 320,
          menubar: false,
          branding: false,
          promotion: false,
          placeholder: placeholder ?? '',
          language: 'es',
          plugins: 'lists link autoresize',
          toolbar: 'undo redo | blocks | bold italic | bullist numlist | link | removeformat',
          block_formats: 'Párrafo=p; Encabezado 2=h2; Encabezado 3=h3; Encabezado 4=h4',
          content_style:
            'body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 15px; color: #5c534a; line-height: 1.75; margin: 12px; }',
          link_default_target: '_blank',
          link_assume_external_targets: true,
          rel_list: [{ title: 'No seguir', value: 'nofollow noopener noreferrer' }],
        }}
      />
    </div>
  );
}
