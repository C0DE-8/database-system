import { useEffect, useMemo, useRef, useState } from 'react'
import styles from '../../pages/dashboard/Dashboard.module.css'

export function CustomSelect({ label, onChange, options, placeholder = 'Select an option', value }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value)
  }, [options, value])

  useEffect(() => {
    function handleClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function chooseOption(nextValue) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={styles.customSelect} ref={rootRef}>
      {label && <span className={styles.customSelectLabel}>{label}</span>}
      <button
        aria-expanded={open}
        className={styles.customSelectButton}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className={styles.customSelectIcon}>v</span>
      </button>

      {open && (
        <div className={styles.customSelectMenu} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? styles.customSelectOptionActive : styles.customSelectOption}
              key={option.value}
              onClick={() => chooseOption(option.value)}
              role="option"
              type="button"
            >
              <span>{option.label}</span>
              {option.description && <small>{option.description}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
