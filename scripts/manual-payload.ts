import {
  manualArticles,
  manualVersion,
  manualSoftwareVersion,
} from "../src/ui/manual/manual-content";
// Canonical export input shared by generation and drift verification.
process.stdout.write(
  JSON.stringify({
    version: manualVersion,
    softwareVersion: manualSoftwareVersion,
    articles: manualArticles,
  }),
);
