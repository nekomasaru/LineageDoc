import { z } from 'zod';
import matter from 'gray-matter';

// --- Schema Definitions ---

/**
 * Frontmatter Schema (YAML Metadata)
 */
export const FrontmatterSchema = z.object({
    title: z.string().min(1, 'タイトルは必須です'),
    status: z.enum(['draft', 'review', 'approved', 'published']).default('draft'),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    version: z.string().regex(/^v\d+(\.\d+)*$/, 'バージョン形式が不正です (例: v1.0)').optional(),
});

/**
 * Document Structure Schema (Content)
 */
export interface StructureIssue {
    line: number;
    message: string;
    rule: string;
}

// --- Validation Logic ---

export interface ValidationResult {
    valid: boolean;
    issues: {
        line: number;
        message: string;
        severity: 'error' | 'warning';
        source: 'schema' | 'lint';
    }[];
}

/**
 * Validate Markdown Content against MDSCHEMA
 */
export function validateSchema(content: string, schemaDSL?: string): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    // 1. Frontmatter Validation
    try {
        const { data, content: body } = matter(content);

        const result = FrontmatterSchema.safeParse(data);
        if (!result.success) {
            result.error.issues.forEach((issue) => {
                issues.push({
                    line: 1,
                    message: `メタデータ: ${issue.message} (${issue.path.join('.')})`,
                    severity: 'error',
                    source: 'schema'
                });
            });
        }

        // 2. Structure Validation
        // If schemaDSL is provided, try to parse basics
        if (schemaDSL) {
            // Simple logic: If schema mentions level and text, check if that heading exists
            // Format example: - level: 2 \n text: "概要"
            const lines = schemaDSL.split('\n');
            let currentLevel: number | null = null;

            lines.forEach(line => {
                const levelMatch = line.match(/level:\s*(\d+)/);
                const textMatch = line.match(/text:\s*["']?([^"']+)["']?/);

                if (levelMatch) currentLevel = parseInt(levelMatch[1]);
                if (textMatch && currentLevel !== null) {
                    let targetText = textMatch[1].trim();
                    let isRegex = false;
                    let pattern = targetText;

                    if (targetText.startsWith('/') && targetText.endsWith('/') && targetText.length > 2) {
                        isRegex = true;
                        pattern = targetText.slice(1, -1);
                    }

                    const bodyLines = body.split('\n');
                    const headingPrefix = '#'.repeat(currentLevel) + ' ';

                    const exists = bodyLines.some(line => {
                        if (!line.startsWith(headingPrefix)) return false;
                        const actualText = line.slice(headingPrefix.length).trim();

                        if (isRegex) {
                            try {
                                return new RegExp(pattern).test(actualText);
                            } catch (e) {
                                return false;
                            }
                        }
                        return actualText === targetText;
                    });

                    if (!exists) {
                        issues.push({
                            line: 1,
                            message: `構造規定違反: 見出し「${'#'.repeat(currentLevel)} ${targetText}」が見つかりません`,
                            severity: 'warning',
                            source: 'schema'
                        });
                    }
                    currentLevel = null; // reset
                }
            });
        } else {
            // Fallback: Default hardcoded rule
            if (!/^#\s+.+$/m.test(body)) {
                issues.push({
                    line: 1,
                    message: '文章には大見出し(# タイトル)が少なくとも1つ必要です',
                    severity: 'error',
                    source: 'schema'
                });
            }
        }

    } catch (e) {
        issues.push({
            line: 1,
            message: '文章構造の解析に失敗しました',
            severity: 'error',
            source: 'schema'
        });
    }

    return {
        valid: issues.length === 0,
        issues
    };
}
