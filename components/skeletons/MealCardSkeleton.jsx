'use client';

import { Box, Stack, Text, useMantineTheme, useComputedColorScheme } from "@mantine/core";

const MEAL_META = {
  breakfast:  { label: "Desayuno",  emoji: "🍳" },
  midMorning: { label: "Almuerzo",  emoji: "🥪" },
  lunch:      { label: "Comida",    emoji: "🍽️" },
  snack:      { label: "Merienda",  emoji: "🧁" },
  dinner:     { label: "Cena",      emoji: "🍲" },
  lateSnack:  { label: "Re-cena",   emoji: "🌙" },
};

function metaFor(mealType) {
  return MEAL_META[mealType] || { label: mealType || "—", emoji: "🥗" };
}

export default function MealCardSkeleton({ mealType }) {
  const { label, emoji } = metaFor(mealType);
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light');

  // Paleta nutralab
  const brand = theme.colors.nutralabColor || [
    "#f5f6ef","#e5e6e0","#d1d2ca","#b8baad","#a2a594",
    "#949784","#8d917a","#7a7d68","#6c705a","#5c6049",
  ];

  const isDark = computedColorScheme === "dark";
  const base   = isDark ? brand[8] : brand[1];
  const accent = isDark ? brand[9] : brand[4];

  // Color de texto para buen contraste
  const textColor = isDark ? theme.colors.gray[2] : theme.colors.dark[7];

  return (
    <Box
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${base}, ${accent})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderRadius: theme.radius.md,
      }}
    >
      {/* textura suave encima */}
      <Box
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 2px, transparent 2px, transparent 14px)",
          opacity: isDark ? 0.4 : 0.3,
          borderRadius: theme.radius.md,
        }}
      />

      <Stack align="center" gap={2} style={{ zIndex: 1 }}>
        <Text fz={42} style={{ lineHeight: 1 }}>{emoji}</Text>
        <Text fz="xs" style={{ color: textColor }}>{label}</Text>
      </Stack>
    </Box>
  );
}
