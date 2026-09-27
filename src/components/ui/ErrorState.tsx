export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 bg-sand p-8">
      <p className="text-[15px]">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm font-semibold underline">
          Reintentar
        </button>
      )}
    </div>
  )
}
