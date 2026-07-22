export function ComingSoon({
  title,
  description,
  endpoints,
}: {
  title: string;
  description: string;
  endpoints: string[];
}) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-dashed border-neutral-800 p-10 text-center">
      <span className="mb-3 inline-block rounded-full bg-neutral-800 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400">
        Coming soon
      </span>
      <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
      <div className="mt-5 text-left">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">Planned endpoints</p>
        <ul className="space-y-1">
          {endpoints.map((ep) => (
            <li key={ep} className="rounded bg-neutral-900 px-3 py-1.5 font-mono text-xs text-neutral-400">
              {ep}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
