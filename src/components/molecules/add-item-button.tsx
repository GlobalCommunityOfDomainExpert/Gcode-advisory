import { Button } from "@/components/atoms";

export interface AddItemButtonProps {
  label: string;
}

export function AddItemButton({ label }: AddItemButtonProps) {
  return (
    <Button type="button" variant="secondary" className="w-full">
      + {label}
    </Button>
  );
}
