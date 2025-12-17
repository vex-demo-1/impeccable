---
patterns:
  - name: Typography
    items:
      - Use a modular type scale
      - Pair a distinctive display font with a refined body font
  - name: Color & Contrast
    items:
      - Use off-whites and near-blacks for softer, sophisticated feel
      - Use the latest CSS has to offer for color and gradients
  - name: Layout & Space
    items:
      - Create visual rhythm through varied spacing
      - Use asymmetry and unexpected compositions
      - Break the grid intentionally for emphasis
  - name: Motion
    items:
      - Use motion to convey state changes effectively
      - Design motion inspired by the real world (easing, staggering, etc)
  - name: Interaction
    items:
      - Make interactions *feel* fast by using patterns like optimistic UI
      - Use progressive disclosure of sophistication
      - Make every surface intentional, actionable and delightful
antipatterns:
  - name: Typography
    items:
      - Don't use overused fonts like Arial or Inter
      - You love to put big icons with rounded corners above titles. Resist. They rarely add value and make sites look cheap.
  - name: Color & Contrast
    items:
      - Don't use gray text on colored backgrounds
      - Don't use pure gray or black. Always tint - pure black/gray never appears in nature.
  - name: Layout & Space
    items:
      - Don't wrap everything in cards
      - Don't nest cards inside cards
      - Modals are lazy. Only use modals if there's truly no better alternative
  - name: Motion
    items:
      - Don't animate layout properties (width, height, padding, margin) - use transform instead
      - Don't use bounce or elastic easing - they feel dated and tacky; use ease-out-quart/quint/expo
  - name: Interaction
    items:
      - Don't repeat the same information (redundant headers, intro restating heading, etc.)
  - name: Responsive
    items:
      - Don't hide critical functionality on mobile
---
