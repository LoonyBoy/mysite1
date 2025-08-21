import React, { useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const Container = styled.div`
  position: relative;
  width: 100%;
`

const Floating = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  pointer-events: none;
  color: #fff;
  display: flex;
  gap: 0;
  align-items: center;

  @media (max-width: 768px) {
    left: 18px;
  }
`

const StyledInput = styled.input`
  background: transparent; /* no filled box */
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.12);
  padding: 12px 16px 10px 16px; /* less vertical padding to align with line */
  color: #fff;
  font-size: 1rem;
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
    padding: 12px 16px 10px 16px;
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
  padding: 12px 16px 10px 16px;
  color: #fff;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
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
    padding: 12px 16px 10px 16px;
    height: 48px;
    line-height: 48px;
    border-radius: 0;
    font-size: 16px;
    min-height: 48px;
    resize: none;
  }
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
    color: 'inherit'
  },
  animate: {
    y: '-120%',
    color: 'rgba(255,255,255,0.5)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
}

const AnimatedInput = ({ label, value = '', onChange = () => {}, type = 'text', className = '', multiline = false, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)
  const showLabel = isFocused || (value && value.toString().length > 0)

  return (
    <Container className={className}>
      <Floating
        variants={containerVariants}
        initial="initial"
        animate={showLabel ? 'animate' : 'initial'}
        aria-hidden
      >
        {label.split('').map((char, idx) => (
          <motion.span
            key={idx}
            style={{ display: 'inline-block', fontSize: 14, lineHeight: '1' }}
            variants={letterVariants}
            transition={{ duration: 0.24 }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </Floating>

      {multiline ? (
        <StyledTextArea
          {...props}
          value={value}
          onChange={(e) => onChange(e)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label}
        />
      ) : (
        <StyledInput
          {...props}
          type={type}
          value={value}
          onChange={(e) => onChange(e)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label}
        />
      )}
    </Container>
  )
}

export default AnimatedInput
