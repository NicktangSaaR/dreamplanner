
// This file is now deprecated and split into smaller files
// It's kept temporarily for backwards compatibility but should be removed in future updates
import { addDocumentHeader } from './documentHeader';
import { addScoresTable } from './scoresTable';
import { addCriteriaDescriptions } from './criteriaUtils';
import { addCommentsSection } from './commentsSection';

// Re-export all functions for backward compatibility
export {
  addDocumentHeader,
  addScoresTable,
  addCriteriaDescriptions,
  addCommentsSection
};
