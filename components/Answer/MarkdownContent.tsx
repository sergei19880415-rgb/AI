"use client";

import { useState, type ReactNode } from "react";

type MarkdownBlock =
    | { type: "heading"; level: number; text: string }
    | { type: "paragraph"; lines: string[] }
    | { type: "unordered-list"; items: string[] }
    | { type: "ordered-list"; items: string[] }
    | { type: "blockquote"; lines: string[] }
    | { type: "code"; language: string; code: string }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "divider" };

const headingPattern = /^(#{1,6})\s+(.+)$/;
const unorderedListPattern = /^[-+*]\s+(.+)$/;
const orderedListPattern = /^\d+[.)]\s+(.+)$/;
const dividerPattern = /^(?:-{3,}|_{3,}|\*{3,})$/;
const tableDividerCellPattern = /^:?-{3,}:?$/;

const splitTableRow = (line: string) =>
    line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());

const isTableDivider = (line: string) => {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every((cell) => tableDividerCellPattern.test(cell));
};

const isTableStart = (lines: string[], index: number) =>
    index + 1 < lines.length &&
    lines[index].includes("|") &&
    isTableDivider(lines[index + 1]);

const isBlockStart = (lines: string[], index: number) => {
    const trimmed = String(lines[index] || "").trim();
    if (!trimmed) return true;
    if (trimmed.startsWith("```")) return true;
    if (headingPattern.test(trimmed)) return true;
    if (unorderedListPattern.test(trimmed)) return true;
    if (orderedListPattern.test(trimmed)) return true;
    if (trimmed.startsWith(">")) return true;
    if (dividerPattern.test(trimmed)) return true;
    return isTableStart(lines, index);
};

const parseMarkdownBlocks = (content: string): MarkdownBlock[] => {
    const blocks: MarkdownBlock[] = [];
    const lines = content.replace(/\r\n?/g, "\n").split("\n");
    let index = 0;

    while (index < lines.length) {
        const trimmed = lines[index].trim();

        if (!trimmed) {
            index += 1;
            continue;
        }

        if (trimmed.startsWith("```")) {
            const language = trimmed.slice(3).trim();
            const codeLines: string[] = [];
            index += 1;

            while (index < lines.length && !lines[index].trim().startsWith("```")) {
                codeLines.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) index += 1;
            blocks.push({ type: "code", language, code: codeLines.join("\n") });
            continue;
        }

        const headingMatch = headingPattern.exec(trimmed);
        if (headingMatch) {
            blocks.push({
                type: "heading",
                level: headingMatch[1].length,
                text: headingMatch[2].trim(),
            });
            index += 1;
            continue;
        }

        if (dividerPattern.test(trimmed)) {
            blocks.push({ type: "divider" });
            index += 1;
            continue;
        }

        if (isTableStart(lines, index)) {
            const headers = splitTableRow(lines[index]);
            const rows: string[][] = [];
            index += 2;

            while (index < lines.length) {
                const row = lines[index].trim();
                if (!row || !row.includes("|")) break;
                rows.push(splitTableRow(lines[index]));
                index += 1;
            }

            blocks.push({ type: "table", headers, rows });
            continue;
        }

        if (unorderedListPattern.test(trimmed)) {
            const items: string[] = [];

            while (index < lines.length) {
                const match = unorderedListPattern.exec(lines[index].trim());
                if (!match) break;
                items.push(match[1].trim());
                index += 1;
            }

            blocks.push({ type: "unordered-list", items });
            continue;
        }

        if (orderedListPattern.test(trimmed)) {
            const items: string[] = [];

            while (index < lines.length) {
                const match = orderedListPattern.exec(lines[index].trim());
                if (!match) break;
                items.push(match[1].trim());
                index += 1;
            }

            blocks.push({ type: "ordered-list", items });
            continue;
        }

        if (trimmed.startsWith(">")) {
            const quoteLines: string[] = [];

            while (index < lines.length && lines[index].trim().startsWith(">")) {
                quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
                index += 1;
            }

            blocks.push({ type: "blockquote", lines: quoteLines });
            continue;
        }

        const paragraphLines: string[] = [];

        while (index < lines.length && !isBlockStart(lines, index)) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }

        if (paragraphLines.length > 0) {
            blocks.push({ type: "paragraph", lines: paragraphLines });
        } else {
            index += 1;
        }
    }

    return blocks;
};

const getSafeHref = (value: string) => {
    const href = value.trim();
    return /^https?:\/\//i.test(href) || /^mailto:/i.test(href) ? href : "";
};

const inlinePatternSource =
    "(`[^`\\n]+`|\\[([^\\]]+)\\]\\(([^)\\s]+)(?:\\s+\"[^\"]*\")?\\)|\\*\\*([^*]+?)\\*\\*|__([^_]+?)__|~~([^~]+?)~~|\\*([^*\\n]+?)\\*|_([^_\\n]+?)_)";

const renderInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
    const nodes: ReactNode[] = [];
    const pattern = new RegExp(inlinePatternSource, "g");
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

        const token = match[0];
        const key = `${keyPrefix}-${match.index}`;

        if (token.startsWith("`")) {
            nodes.push(
                <code
                    key={key}
                    className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800"
                >
                    {token.slice(1, -1)}
                </code>
            );
        } else if (match[2] && match[3]) {
            const href = getSafeHref(match[3]);
            nodes.push(
                href ? (
                    <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-300 underline decoration-primary-100 underline-offset-2 hover:text-primary-400"
                    >
                        {match[2]}
                    </a>
                ) : (
                    <span key={key}>{match[2]}</span>
                )
            );
        } else if (match[4] || match[5]) {
            nodes.push(
                <strong key={key} className="font-semibold text-slate-900">
                    {match[4] || match[5]}
                </strong>
            );
        } else if (match[6]) {
            nodes.push(
                <del key={key} className="text-slate-500">
                    {match[6]}
                </del>
            );
        } else {
            nodes.push(
                <em key={key} className="italic">
                    {match[7] || match[8] || ""}
                </em>
            );
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
    return nodes.length > 0 ? nodes : [text];
};

const CodeBlock = ({ language, code }: { language: string; code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            // Clipboard can be unavailable in restricted browser contexts.
        }
    };

    return (
        <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-slate-300">
                <span className="truncate font-medium">{language || "Код"}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-white"
                >
                    {copied ? "Скопировано" : "Копировать"}
                </button>
            </div>
            <pre className="overflow-x-auto p-3 text-[13px] leading-5">
                <code>{code}</code>
            </pre>
        </div>
    );
};

const Heading = ({ level, children }: { level: number; children: ReactNode }) => {
    const className =
        level <= 2
            ? "mb-2 mt-4 text-[18px] font-bold leading-6 text-slate-900 first:mt-0"
            : "mb-1.5 mt-3 text-[15px] font-bold leading-5 text-slate-900 first:mt-0";

    if (level === 1) return <h1 className={className}>{children}</h1>;
    if (level === 2) return <h2 className={className}>{children}</h2>;
    if (level === 3) return <h3 className={className}>{children}</h3>;
    if (level === 4) return <h4 className={className}>{children}</h4>;
    if (level === 5) return <h5 className={className}>{children}</h5>;
    return <h6 className={className}>{children}</h6>;
};

const MarkdownContent = ({ content }: { content: string }) => {
    const blocks = parseMarkdownBlocks(content);

    return (
        <div className="min-w-0 text-[15px] leading-[1.65] text-slate-700">
            {blocks.map((block, blockIndex) => {
                const key = `markdown-block-${blockIndex}`;

                if (block.type === "heading") {
                    return (
                        <Heading key={key} level={block.level}>
                            {renderInlineMarkdown(block.text, `${key}-heading`)}
                        </Heading>
                    );
                }

                if (block.type === "unordered-list") {
                    return (
                        <ul key={key} className="my-2 list-disc space-y-1 pl-5 marker:text-slate-400">
                            {block.items.map((item, itemIndex) => (
                                <li key={`${key}-${itemIndex}`}>
                                    {renderInlineMarkdown(item, `${key}-${itemIndex}`)}
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === "ordered-list") {
                    return (
                        <ol key={key} className="my-2 list-decimal space-y-1 pl-5 marker:font-medium marker:text-slate-500">
                            {block.items.map((item, itemIndex) => (
                                <li key={`${key}-${itemIndex}`}>
                                    {renderInlineMarkdown(item, `${key}-${itemIndex}`)}
                                </li>
                            ))}
                        </ol>
                    );
                }

                if (block.type === "blockquote") {
                    return (
                        <blockquote
                            key={key}
                            className="my-3 border-l-4 border-primary-100 bg-white/70 py-2 pl-3 pr-2 text-slate-600"
                        >
                            {block.lines.map((line, lineIndex) => (
                                <span key={`${key}-${lineIndex}`}>
                                    {lineIndex > 0 && <br />}
                                    {renderInlineMarkdown(line, `${key}-${lineIndex}`)}
                                </span>
                            ))}
                        </blockquote>
                    );
                }

                if (block.type === "code") {
                    return <CodeBlock key={key} language={block.language} code={block.code} />;
                }

                if (block.type === "table") {
                    return (
                        <div key={key} className="my-3 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full min-w-[28rem] border-collapse text-left text-[13px] leading-5">
                                <thead className="bg-slate-50 text-slate-800">
                                    <tr>
                                        {block.headers.map((header, headerIndex) => (
                                            <th
                                                key={`${key}-header-${headerIndex}`}
                                                className="border-b border-slate-200 px-3 py-2 font-semibold"
                                            >
                                                {renderInlineMarkdown(header, `${key}-header-${headerIndex}`)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {block.rows.map((row, rowIndex) => (
                                        <tr key={`${key}-row-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">
                                            {block.headers.map((_, cellIndex) => (
                                                <td
                                                    key={`${key}-row-${rowIndex}-cell-${cellIndex}`}
                                                    className="px-3 py-2 align-top"
                                                >
                                                    {renderInlineMarkdown(
                                                        row[cellIndex] || "",
                                                        `${key}-row-${rowIndex}-cell-${cellIndex}`
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                if (block.type === "divider") {
                    return <hr key={key} className="my-4 border-0 border-t border-slate-200" />;
                }

                return (
                    <p key={key} className="my-2 first:mt-0 last:mb-0">
                        {block.lines.map((line, lineIndex) => (
                            <span key={`${key}-${lineIndex}`}>
                                {lineIndex > 0 && <br />}
                                {renderInlineMarkdown(line, `${key}-${lineIndex}`)}
                            </span>
                        ))}
                    </p>
                );
            })}
        </div>
    );
};

export default MarkdownContent;
