# Website Ops Save Location Updated — 2026-05-18

Victor asked to move website-ops report saving into iCloud Drive Downloads.

## New preferred location

Windows path:

```text
C:\Users\Victor\iCloudDrive\Downloads\Website Health Reports
```

WSL path:

```text
/mnt/c/Users/Victor/iCloudDrive/Downloads/Website Health Reports
```

## Actions completed

- Created the new folder if needed.
- Copied existing Markdown reports from the old local Documents report folder into the new iCloud Downloads report folder without deleting the originals.
- Updated the weekly Hermes portfolio health digest cron job to save future reports to the new iCloud Downloads folder.
- Saved this durable note in the new folder.

## Weekly digest job

- Job ID: `e283fff840e3`
- Name: `Victor portfolio weekly health digest`
- Schedule: Mondays 9:00 AM
- New report path template:

```text
/mnt/c/Users/Victor/iCloudDrive/Downloads/Website Health Reports/weekly-site-health-YYYY-MM-DD.md
```
