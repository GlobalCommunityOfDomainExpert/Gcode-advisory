export interface FormSectionHeadingProps {
  title: string;
}

export function FormSectionHeading({ title }: FormSectionHeadingProps) {
  return (
    <h3 className="text-large text-text-primary border-border-light border-b pb-4 font-bold">
      {title}
    </h3>
  );
}
