interface SchemaOrgProps {
  data: object | object[];
}

/**
 * Injects a JSON-LD <script> tag for structured data.
 * Use as a Server Component — no "use client" needed.
 */
export function SchemaOrg({ data }: SchemaOrgProps) {
  const json = JSON.stringify(Array.isArray(data) ? data : [data]);
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
