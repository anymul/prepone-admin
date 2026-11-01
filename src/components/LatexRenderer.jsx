

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

const LatexRenderer = ({ text, block = false, lang, style, className }) => {
    if (!text) return null;

    const isHindi = lang === 'hi' || DEVANAGARI_REGEX.test(text);

    const parts = [];
    let currentIndex = 0;

    // Match all LaTeX delimiters: $...$ , $$...$$, \(...\), \[...\]
    const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\$]+?\$)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > currentIndex) {
            parts.push({
                type: 'text',
                content: text.substring(currentIndex, match.index),
            });
        }

        // Add the LaTeX match
        const latexContent = match[0];

        if (latexContent.startsWith('$$') && latexContent.endsWith('$$')) {
            // Display math: $$...$$
            parts.push({
                type: 'block',
                content: latexContent.slice(2, -2),
            });
        } else if (latexContent.startsWith('\\[') && latexContent.endsWith('\\]')) {
            // Display math: \[...\]
            parts.push({
                type: 'block',
                content: latexContent.slice(2, -2),
            });
        } else if (latexContent.startsWith('\\(') && latexContent.endsWith('\\)')) {
            // Inline math: \(...\)
            parts.push({
                type: 'inline',
                content: latexContent.slice(2, -2),
            });
        } else if (latexContent.startsWith('$') && latexContent.endsWith('$')) {
            // Inline math: $...$
            parts.push({
                type: 'inline',
                content: latexContent.slice(1, -1),
            });
        }

        currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
        parts.push({
            type: 'text',
            content: text.substring(currentIndex),
        });
    }

    // If no LaTeX found, return plain text
    if (parts.length === 0) {
        return (
            <span
                lang={isHindi ? 'hi' : undefined}
                className={className}
                style={{
                    ...(isHindi ? { fontFamily: '"Noto Serif Devanagari", "IBM Plex Sans Devanagari", serif' } : {}),
                    ...style,
                }}
            >
                {text}
            </span>
        );
    }

    return (
        <span
            lang={isHindi ? 'hi' : undefined}
            className={className}
            style={{
                lineHeight: '1.8',
                ...(isHindi ? { fontFamily: '"Noto Serif Devanagari", "IBM Plex Sans Devanagari", serif' } : {}),
                ...style,
            }}
        >
            {parts.map((part, index) => {
                if (part.type === 'text') {
                    return <span key={index}>{part.content}</span>;
                } else if (part.type === 'inline') {
                    return (
                        <InlineMath
                            key={index}
                            math={part.content}
                            errorColor="#cc0000"
                            renderError={(error) => {
                                console.error('KaTeX error:', error);
                                return <span style={{ color: 'red' }}>[Math Error]</span>;
                            }}
                        />
                    );
                } else {
                    return (
                        <div key={index} style={{ margin: '10px 0', textAlign: 'center' }}>
                            <BlockMath
                                math={part.content}
                                errorColor="#cc0000"
                                renderError={(error) => {
                                    console.error('KaTeX error:', error);
                                    return <span style={{ color: 'red' }}>[Math Error]</span>;
                                }}
                            />
                        </div>
                    );
                }
            })}
        </span>
    );
};

export default LatexRenderer;
