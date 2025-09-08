import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

export function ResponsiveInput({ label, helperText, ...props }: ResponsiveInputProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor={props.id} className="text-sm font-medium">
        {label}
      </Label>
      <Input {...props} className="w-full" />
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}
