"use client";

type TimeInputProps = {
  id: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  className: string;
};

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function TimeInput({
  id,
  name,
  defaultValue,
  placeholder = "08:00",
  className,
}: TimeInputProps) {
  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      maxLength={5}
      defaultValue={formatTimeInput(defaultValue)}
      placeholder={placeholder}
      className={className}
      onChange={(event) => {
        event.currentTarget.value = formatTimeInput(event.currentTarget.value);
      }}
      onPaste={(event) => {
        event.preventDefault();

        const pastedText = event.clipboardData.getData("text");
        event.currentTarget.value = formatTimeInput(pastedText);
      }}
    />
  );
}
