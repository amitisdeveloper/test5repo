# July 25, 2026 - Homepage Update Checklist

Use this document to reproduce today's homepage changes on other Git branches.

## Completed tasks

- [x] Created this July 25 task register.
- [x] Renamed the homepage chart section from **Previous View Chart** to **View Chart**.
- [x] Moved the View Chart section to the bottom of the homepage, immediately above the footer.
- [x] Made the current IST month and year load automatically in the chart on page load.
- [x] Replaced the chart modal with an inline, scrollable chart table inside the View Chart section.
- [x] Changed every homepage **View Chart** action to scroll to the inline View Chart section instead of opening a modal.
- [x] Applied the chart behavior to the legacy homepage and all three domain-specific homepage versions.
- [x] Removed the **Featured Games** heading from every homepage.
- [x] Removed the corresponding **Featured Games** link from the editorial homepage navigation.
- [x] Changed the homepage dead zone from 9:00 AM-3:14 PM IST to **9:00 AM-12:00 PM IST**.
- [x] Updated next-game time handling so games scheduled from 12:00 PM onward are eligible.
- [x] Fixed the Next Game Announcement to select the earliest upcoming game chronologically. For example, Rajasthan Bazaar at 1:00 PM must appear before Shri Ganesh at 4:45 PM.
- [x] Excluded games with missing or invalid result times from the Next Game Announcement.
- [x] Verified the changes with `npm.cmd run build`.

## Files changed

- `src/App.tsx`
  - Legacy homepage layout and chart-button behavior.
  - Dead-zone calculation.
  - Next-game time calculation.
- `src/components/PreviousViewChart.tsx`
  - View Chart title.
  - Bottom-page inline chart.
  - Current-month initial chart period.
  - Removed modal behavior.
- `src/components/home/HomeExperience.tsx`
  - Domain-specific homepage layout.
  - Removed Featured Games title/navigation text.
  - Routed chart actions to the inline section.
- `src/hooks/useHomepageResults.ts`
  - Domain-specific dead-zone calculation.
  - Noon-and-later next-game eligibility.
  - Invalid-time exclusion.
- `25julytodolist.md`
  - This reusable checklist.

## Expected behavior on every branch

1. The dead zone is active from 9:00 AM through 12:00 PM IST.
2. After the dead zone, the Next Game Announcement shows the earliest unresulted game whose valid result time has not passed.
3. At 12:xx PM, an unresulted 1:00 PM game is selected ahead of later games.
4. A game with no valid `h:mm AM/PM` result time is never selected as the next game.
5. The View Chart section appears at the bottom of the homepage.
6. The current IST month chart is visible inline on initial page load.
7. Homepage View Chart buttons scroll to that inline section; no homepage chart modal opens.
8. No Featured Games title is displayed.

## Recall this checklist after switching branches

From the repository root in PowerShell:

```powershell
Get-Content .\25julytodolist.md
```

To search for a specific task:

```powershell
Select-String -Path .\25julytodolist.md -Pattern "Next Game|View Chart|dead zone"
```

To verify whether the checklist exists after switching:

```powershell
Test-Path .\25julytodolist.md
```

## Important Git note

This checklist is currently an untracked file. It normally remains in the working directory during a branch switch, but Git does not preserve it in branch history until it is committed.

Before switching branches, check:

```powershell
git status --short
```

If the file is committed on the current branch, it can be read from any other branch without switching back:

```powershell
git show resultv2:25julytodolist.md
```

After reproducing the changes on another branch, run:

```powershell
npm.cmd run build
```
