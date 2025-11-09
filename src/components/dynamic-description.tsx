"use client";

import { useEffect, useState, useRef } from "react";

interface DynamicDescriptionProps {
  baseText: string;
  dateOfBirth: string | Date;
  className?: string;
}

export function DynamicDescription({
  baseText,
  dateOfBirth,
  className,
}: DynamicDescriptionProps) {
  const [age, setAge] = useState<string>("");
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    let dob: Date;
    
    if (typeof dateOfBirth === "string") {
      // Parse date string and create date at local midnight to avoid timezone issues
      const [year, month, day] = dateOfBirth.split("-").map(Number);
      dob = new Date(year, month - 1, day);
    } else {
      dob = dateOfBirth;
    }

    const calculateAge = () => {
      const now = new Date();
      const diff = now.getTime() - dob.getTime();
      const years = diff / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
      const ageString = years.toFixed(9);
      setAge(ageString);
    };

    // Calculate immediately
    calculateAge();

    // Use requestAnimationFrame for smooth 60fps updates (approximately 16.67ms)
    const animate = () => {
      calculateAge();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dateOfBirth]);

  if (!age) {
    return <span className={className}>{baseText}</span>;
  }

  // Find and replace the age number with a fixed-width version to prevent layout shift
  const ageRegex = /(been here for )(\d+\.\d+)( years)/i;
  const match = baseText.match(ageRegex);
  
  // Fixed-width styling for the age number to prevent layout shift
  const ageStyle: React.CSSProperties = {
    fontVariantNumeric: 'tabular-nums',
    minWidth: '12ch',
    display: 'inline-block',
    textAlign: 'left',
    letterSpacing: '0',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  };
  
  if (match && match.index !== undefined) {
    // We found the pattern, render with fixed-width age number
    const beforeMatch = baseText.substring(0, match.index);
    const afterMatch = baseText.substring(match.index + match[0].length);
    
    return (
      <span className={className}>
        {beforeMatch}
        {match[1]}
        <span className="font-mono" style={ageStyle}>
          {age}
        </span>
        {match[3]}
        {afterMatch}
      </span>
    );
  }

  // Fallback: replace the number pattern if regex didn't match as expected
  const parts = baseText.split(/(\d+\.\d+)/);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (/^\d+\.\d+$/.test(part)) {
          return (
            <span key={index} className="font-mono" style={ageStyle}>
              {age}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

