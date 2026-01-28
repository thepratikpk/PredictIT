import * as React from "react"

// Simple className utility function
function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "relative h-1 w-full overflow-hidden rounded-full bg-md-primary-container",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-md-primary rounded-full transition-all duration-300 ease-md-standard"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }