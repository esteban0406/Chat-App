"use client";

type Props = {
  name: string;
  color: string;
  disabled: boolean;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
};

export default function RoleSettingsSection({
  name,
  color,
  disabled,
  onNameChange,
  onColorChange,
}: Props) {
  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Configuración del rol
      </h4>

      {/* Name field */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">
          Nombre del rol
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
          required
          maxLength={50}
          placeholder="Moderador"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] text-white placeholder-text-muted transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
        />
      </div>

      {/* Color field */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Color</label>
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            disabled={disabled}
            className="h-9 w-9 cursor-pointer rounded-full border-2 border-border bg-transparent disabled:opacity-50"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            disabled={disabled}
            className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-white transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
          />
        </div>
      </div>

      {disabled && (
        <p className="text-xs italic text-text-muted">
          Los roles por defecto no se pueden modificar.
        </p>
      )}
    </div>
  );
}
