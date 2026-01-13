# Pace Plan Split Editing - Feature Documentation

## Overview

The pace plan system now supports detailed split editing, allowing users to break down their race into multiple segments with individual target times and distances. This enables more precise race pacing strategies and better playlist alignment.

## Key Features

### 1. **Automatic Split Creation**
When creating a new pace plan:
- A single default split is automatically created covering the entire race distance
- Target time is set to the user's specified goal time
- Pace is automatically calculated (min/km)

### 2. **Split Editing Interface**
- **Edit Button**: Click the edit icon (pencil) on any pace plan card to open split editor
- **Expandable UI**: Split editor appears as a collapsible table below the pace plan details
- **Real-time Calculations**: Pace is automatically recalculated when distance or time changes

### 3. **Split Management Operations**

#### Adding Splits
- "Add Split" button creates new splits with default values (5km, 25 minutes)
- New splits can be customized immediately after creation

#### Editing Splits
- **Distance**: Number input field (supports decimals, min 0.1km)
- **Target Time**: Accepts both formats:
  - Time format: `MM:SS` or `HH:MM:SS` (e.g., "25:30" for 25 minutes 30 seconds)
  - Seconds format: Raw number (e.g., "1530" for 25 minutes 30 seconds)
- **Pace**: Automatically calculated and displayed as read-only (min/km)

#### Removing Splits
- Delete button (trash icon) removes individual splits
- Cannot remove the last remaining split (minimum 1 split required)

### 4. **Data Validation**
- **No Strict Validation**: Temporary invalid states are allowed during editing
- **Flexible Input**: Users can create splits that don't sum to race distance
- **Future Enhancement**: Validation warnings can be added later without breaking changes

## User Interface

### Pace Plan Cards
```
┌─────────────────────────────────────────────────────┐
│ Marathon Training Plan               [Edit] [Delete] │
│ Target Time: 3h 30m 0s                              │
│ Splits: 4 • Created: 1/13/2026                     │
│ 🎵 Playlist: Running Motivation                     │
│                                                     │
│ ┌─ Edit Splits ────────────────────── [Add Split] ┐ │
│ │ Distance │ Target Time │ Pace     │ Actions     │ │
│ │ 10.5 km  │ 52:30       │ 5.00     │ [Delete]    │ │
│ │ 10.5 km  │ 53:00       │ 5.05     │ [Delete]    │ │
│ │ 10.5 km  │ 53:30       │ 5.10     │ [Delete]    │ │
│ │ 10.6 km  │ 51:00       │ 4.81     │ [Delete]    │ │
│ │                        [Cancel] [Save Changes]   │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Timeline Integration
- Updated timeline renderer works with new split structure
- Each split displays as proportional rectangle based on target time
- Distance and time labels shown for each split segment

## Technical Implementation

### Data Structure
```typescript
interface Split {
  distance: number;        // km (supports decimals)
  targetTime: number;      // seconds
  pace: number;           // calculated min/km
  elevation?: number;     // optional (unchanged)
}

interface PacePlan {
  splits: Split[];        // array of splits (min 1)
  targetTime: number;     // auto-calculated from splits sum
  // ... other fields unchanged
}
```

### Key Functions

#### pacePlanManager.ts
- `createPacePlan()` - Creates pace plan with automatic default split
- `updatePacePlanSplits()` - Saves split changes and recalculates total time
- `calculatePace()` - Computes pace from distance and time
- `formatTime()` - Converts seconds to MM:SS or HH:MM:SS display
- `parseTimeToSeconds()` - Parses time strings to seconds

#### PacePlanSection.tsx
- `handleEditSplits()` - Toggle split editor visibility
- `handleSplitChange()` - Update split values with live pace calculation
- `handleAddSplit()` - Create new split with defaults
- `handleRemoveSplit()` - Delete split (with minimum 1 enforcement)
- `handleSaveSplits()` - Persist changes to Firestore

## Backward Compatibility

### Existing Pace Plans
- **No Breaking Changes**: Existing pace plans with empty `splits: []` continue to work
- **Migration**: Old pace plans can be edited to add splits
- **Timeline Display**: Works with both old (empty splits) and new (populated splits) data

### Database Structure
- Firestore schema unchanged - `splits` array field already existed
- New fields added to `createPacePlan()` parameters are optional
- Target time recalculation maintains data consistency

## User Workflow

### Creating a New Pace Plan with Splits
1. Select race from dropdown
2. Enter pace plan title and target time
3. Click "Create Pace Plan"
4. **NEW**: Default split automatically created for full race distance
5. Click edit icon to customize splits
6. Add, modify, or remove splits as needed
7. Save changes

### Editing Existing Splits
1. Find pace plan in list
2. Click edit icon (pencil button)
3. Modify distances and times in the table
4. Add new splits with "Add Split" button
5. Remove splits with delete button (min 1 required)
6. Click "Save Changes" or "Cancel"

### Timeline Visualization
1. Click on pace plan card to select it
2. Timeline canvas displays below with split visualization
3. Each split shows as proportional rectangle
4. Distance and target time labels visible

## Future Enhancements

### Validation (Future)
- Sum of splits distance should match race distance
- Sum of splits time should be reasonable for race distance
- Minimum/maximum pace warnings
- Invalid state highlighting

### Advanced Features (Future)
- Split templates (negative/positive/even splits)
- Elevation gain per split
- Auto-split generation based on race distance
- Export to GPX/TCX formats

## Testing

### Automated Tests
- `pacePlanManager.splits.test.ts` - Unit tests for utility functions
- Tests cover pace calculation, time formatting, and parsing
- Edge cases: zero values, invalid inputs, boundary conditions

### Manual Testing Scenarios
- Create pace plan → verify default split creation
- Edit splits → verify pace recalculation
- Add/remove splits → verify UI constraints
- Save changes → verify Firestore persistence
- Timeline display → verify visual rendering

## Dependencies

- **React 18+**: Component lifecycle and state management
- **Material-UI**: Table, TextField, Button, Collapse components
- **Firebase**: Firestore for split data persistence
- **TypeScript**: Type safety for Split and PacePlan interfaces

---

**Status**: ✅ Complete - Ready for testing
**Next Features**: Drag-and-drop track reordering (Prompt 7.1)
**Version**: Supports temporary invalid states as requested