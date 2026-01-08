// import React from 'react';
// import { InlineMath, BlockMath } from 'react-katex';
// import 'katex/dist/katex.min.css';

// const LatexRenderer = ({ text, block = false }) => {
//   if (!text) return null;

//   // Split text by LaTeX delimiters
//   const parts = [];
//   let currentIndex = 0;

//   // Match both $...$ (inline) and $$...$$ (display) patterns
//   const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
//   let match;

//   while ((match = regex.exec(text)) !== null) {
//     // Add text before the match
//     if (match.index > currentIndex) {
//       parts.push({
//         type: 'text',
//         content: text.substring(currentIndex, match.index),
//       });
//     }

//     // Add the LaTeX match
//     const latexContent = match[0];
//     if (latexContent.startsWith('$$') && latexContent.endsWith('$$')) {
//       // Display math (block)
//       parts.push({
//         type: 'block',
//         content: latexContent.slice(2, -2),
//       });
//     } else {
//       // Inline math
//       parts.push({
//         type: 'inline',
//         content: latexContent.slice(1, -1),
//       });
//     }

//     currentIndex = match.index + match[0].length;
//   }

//   // Add remaining text
//   if (currentIndex < text.length) {
//     parts.push({
//       type: 'text',
//       content: text.substring(currentIndex),
//     });
//   }

//   // If no LaTeX found, return plain text
//   if (parts.length === 0) {
//     return <span>{text}</span>;
//   }

//   return (
//     <span>
//       {parts.map((part, index) => {
//         if (part.type === 'text') {
//           return <span key={index}>{part.content}</span>;
//         } else if (part.type === 'inline') {
//           return <InlineMath key={index} math={part.content} />;
//         } else {
//           return (
//             <div key={index} style={{ margin: '10px 0' }}>
//               <BlockMath math={part.content} />
//             </div>
//           );
//         }
//       })}
//     </span>
//   );
// };

// export default LatexRenderer;

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const LatexRenderer = ({ text, block = false }) => {
    if (!text) return null;

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
        return <span>{text}</span>;
    }

    return (
        <span style={{ lineHeight: '1.8' }}>
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
