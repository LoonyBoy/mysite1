import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const Container = styled.div`
  position: relative;
  width: 100%;
  /* Ensure inputs use the project's Unbounded font on mobile/desktop */
  font-family: 'Unbounded', sans-serif;
`

const Floating = styled(motion.div)`
  position: absolute;
  left: 16px;
  pointer-events: none;
  color: #fff;
  font-family: 'Unbounded', sans-serif;
  display: flex;
  gap: 0;
  align-items: center;
  top: ${props => (props.topAligned ? '8px' : '50%')};
  transform: ${props => (props.topAligned ? 'none' : 'translateY(-50%)')};
  transition: top 160ms ease, transform 160ms ease, font-size 140ms ease, opacity 140ms ease;
  font-size: ${props => (props.topAligned ? '13px' : '15px')};
  font-weight: 500;
  opacity: ${props => (props.topAligned ? 0.95 : 1)};
  z-index: 3;

  @media (max-width: 768px) {
    left: 18px;
    top: ${props => (props.topAligned ? '6px' : '50%')};
    font-size: ${props => (props.topAligned ? '12px' : '15px')};
  }
`

const StyledInput = styled.input`
  background: transparent; /* no filled box */
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.12);
  /* Use 8px grid: base padding top 16, bottom 8. When label is raised give 24px top */
  padding: ${props => (props.topAligned ? '24px 16px 8px 16px' : '16px 16px 8px 16px')};
  color: #fff;
  font-family: 'Unbounded', sans-serif;
  font-weight: 400;
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.18s ease, color 0.18s ease;

  &:focus {
    outline: none;
    border-bottom-color: rgba(255, 255, 255, 0.5);
  }

  &::placeholder {
    color: transparent;
  }

  @media (max-width: 768px) {
  padding: ${props => (props.topAligned ? '24px 16px 8px 16px' : '16px 16px 8px 16px')};
    height: 48px;
    line-height: 48px;
    border-radius: 0;
    font-size: 16px;
  }
`

const StyledTextArea = styled.textarea`
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.12);
  /* 8px grid paddings similar to input */
  padding: ${(p) => (p.bigPadding ? '20px 16px 8px 16px' : '16px 16px 8px 16px')};
  color: #fff;
  font-family: 'Unbounded', sans-serif;
  font-weight: 400;
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.18s ease, color 0.18s ease;

  &:focus {
    outline: none;
    border-bottom-color: rgba(255, 255, 255, 0.5);
  }

  &::placeholder {
    color: transparent;
  }

  @media (max-width: 768px) {
  padding: ${(p) => (p.bigPadding ? '20px 16px 8px 16px' : '16px 16px 8px 16px')};
    border-radius: 0;
    font-size: 16px;
    min-height: 48px;
    resize: none;
  }
    /* tighter inter-line spacing for mobile */
    line-height: 1.25;
    /* ensure initial height fits single-line */
    height: auto;
    overflow: hidden;
`

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02
    }
  }
}

const letterVariants = {
  initial: {
    y: 0,
    // use explicit color so framer-motion can interpolate to rgba(255,255,255,0.6)
    color: 'rgba(255,255,255,0.95)'
  },
  animate: {
    y: '-60%',
    color: 'rgba(255,255,255,0.6)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
}

const AnimatedInput = ({ label, value = '', onChange = () => {}, type = 'text', className = '', multiline = false, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isMultilineActive, setIsMultilineActive] = useState(multiline)
  const [multilineLines, setMultilineLines] = useState(1)
  const initialMultilineRef = useRef(multiline)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const showLabel = isFocused || (value && value.toString().length > 0)

  useEffect(() => {
    // keep internal multiline state in sync if prop changes
    setIsMultilineActive(multiline)
  }, [multiline])

  // initialize line count from existing value and auto-expand if value contains newline
  useEffect(() => {
    const lines = (value || '').toString().split('\n').length
    setMultilineLines(lines)
    if (lines > 1 && !isMultilineActive) {
      setIsMultilineActive(true)
    }
  }, [])

  // whenever value or multiline active state changes, ensure textarea height matches content
  useEffect(() => {
    if (isMultilineActive && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isMultilineActive, value])

  return (
    <Container className={className}>
      <Floating
        topAligned={isMultilineActive || showLabel || multilineLines >= 2}
        variants={containerVariants}
        initial="initial"
        animate={showLabel ? 'animate' : 'initial'}
        aria-hidden
      >
        {label.split('').map((char, idx) => (
          <motion.span
            key={idx}
            style={{ display: 'inline-block', lineHeight: '1' }}
            variants={letterVariants}
            transition={{ duration: 0.18 }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </Floating>

      {isMultilineActive ? (
        <StyledTextArea
          {...props}
          rows={2}
          bigPadding={multilineLines >= 2}
          topAligned={isMultilineActive || showLabel}
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            // Enforce max 2 lines
            const raw = e && e.target ? e.target.value : ''
            const parts = raw.split('\n')
            const trimmed = parts.length > 2 ? parts.slice(0, 2).join('\n') : raw
            try {
              onChange({ target: { value: trimmed } })
            } catch (err) {
              // fallback
              onChange({ target: { value: trimmed } })
            }

            // track line count
            const lines = (trimmed || '').split('\n').length
            setMultilineLines(lines)

            // Auto-resize textarea to fit content (so underline moves down)
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
                const h = textareaRef.current.scrollHeight
                textareaRef.current.style.height = h + 'px'
              }
            }, 0)

            // If content collapsed to a single line, switch back to single-line input
            // but only do this if the component wasn't initialized as multiline
            if (lines <= 1 && !initialMultilineRef.current) {
              setIsMultilineActive(false)
              // focus the single-line input on next tick and place caret at end
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus()
                  const pos = (trimmed || '').length
                  try {
                    inputRef.current.setSelectionRange(pos, pos)
                  } catch (err) {
                    // ignore if not supported
                  }
                }
              }, 50)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const currentLines = (value || '').split('\n').length
              if (currentLines >= 2) {
                // prevent adding more lines
                e.preventDefault()
              }
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label}
        />
      ) : (
        <StyledInput
          {...props}
          topAligned={isMultilineActive || showLabel}
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label}
          onKeyDown={(e) => {
            // On Enter (or Shift+Enter) expand to textarea and insert a newline when allowed
            if (e.key === 'Enter') {
              e.preventDefault()
              const currentLines = (value || '').split('\n').length
              // if there's room for another line, insert a newline so text moves to second line
              if (currentLines < 2) {
                const newVal = (value || '') + '\n'
                try {
                  onChange({ target: { value: newVal } })
                } catch (err) {
                  onChange({ target: { value: newVal } })
                }
              }
              setIsMultilineActive(true)
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.focus()
                  // place caret at end
                  const pos = (value || '').length + 1
                  try {
                    textareaRef.current.setSelectionRange(pos, pos)
                  } catch (err) {
                    // ignore if not supported
                  }
                }
              }, 50)
            }
          }}
        />
      )}
    </Container>
  )
}

export default AnimatedInput
