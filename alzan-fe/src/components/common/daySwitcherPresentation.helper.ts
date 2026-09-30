export type DaySwitcherVariant = 'nutrition' | 'training';

interface DaySwitcherMarkerInput {
  variant: DaySwitcherVariant;
  isMarked: boolean;
  isOverTarget: boolean;
  isSelected: boolean;
  primaryColor: string;
}

interface DaySwitcherMarkerPresentation {
  borderColor: string | undefined;
  dotColor: string | null;
}

export const getDaySwitcherMarkerPresentation = ({
  variant,
  isMarked,
  isOverTarget,
  isSelected,
  primaryColor,
}: DaySwitcherMarkerInput): DaySwitcherMarkerPresentation => {
  if (variant === 'nutrition') {
    const borderColor = isMarked ? '#7C3AED' : isOverTarget ? '#D97706' : undefined;
    const hasMarker = isMarked || isOverTarget;

    return {
      borderColor,
      dotColor: hasMarker ? (isSelected ? '#FFFFFF' : isMarked ? '#7C3AED' : '#D97706') : null,
    };
  }

  return {
    borderColor: undefined,
    dotColor: isMarked ? (isSelected ? '#FFFFFF' : primaryColor) : null,
  };
};
