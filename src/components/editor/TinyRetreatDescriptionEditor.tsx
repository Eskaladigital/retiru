'use client';

import { Editor } from '@tinymce/tinymce-react';

function tinyApiKey(): string {
  const k = process.env.NEXT_PUBLIC_TINYMCE_API_KEY?.trim();
  return k || 'no-api-key';
}

export interface TinyRichTextEditorProps {
  id: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Altura del área editable en px */
  height?: number;
  language?: 'es' | 'en';
  /** Insertar imagen por URL (p. ej. blog); en retiros se deja en false */
  enableImage?: boolean;
}

export function TinyRichTextEditor({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  height = 320,
  language = 'es',
  enableImage = false,
}: TinyRichTextEditorProps) {
  const plugins = enableImage ? 'lists link autoresize image' : 'lists link autoresize';
  const toolbar = enableImage
    ? 'undo redo | blocks | bold italic | bullist numlist | link image | removeformat'
    : 'undo redo | blocks | bold italic | bullist numlist | link | removeformat';
  const blockFormats =
    language === 'en'
      ? 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4'
      : 'Párrafo=p; Encabezado 2=h2; Encabezado 3=h3; Encabezado 4=h4';
  const relList =
    language === 'en'
      ? [{ title: 'No follow', value: 'nofollow noopener noreferrer' }]
      : [{ title: 'No seguir', value: 'nofollow noopener noreferrer' }];

  return (
    <div className="rounded-xl border border-sand-200 overflow-hidden bg-white [&_.tox-tinymce]:border-0 [&_.tox-tinymce]:rounded-xl">
      <Editor
        id={id}
        apiKey={tinyApiKey()}
        value={value}
        onEditorChange={(html) => onChange(html)}
        disabled={disabled}
        init={{
          height,
          menubar: false,
          branding: false,
          promotion: false,
          placeholder: placeholder ?? '',
          language,
          plugins,
          toolbar,
          block_formats: blockFormats,
          content_style:
            'body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 15px; color: #5c534a; line-height: 1.75; margin: 12px; }',
          link_default_target: '_blank',
          link_assume_external_targets: true,
          rel_list: relList,
          image_title: true,
          automatic_uploads: false,
        }}
      />
    </div>
  );
}

/** Descripción de retiro: español, sin imágenes en el cuerpo, altura compacta. */
export function TinyRetreatDescriptionEditor(
  props: Omit<TinyRichTextEditorProps, 'height' | 'language' | 'enableImage'>
) {
  return <TinyRichTextEditor {...props} height={320} language="es" enableImage={false} />;
}
