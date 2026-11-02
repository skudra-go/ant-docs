import React from 'react';
import clsx from 'clsx';
import {Highlight} from 'prism-react-renderer';
import antPrism from '@site/src/theme/prism-ant';

const open = '⟦';
const close = '⟧';

// parseMarks strips ⟦-:text⟧ (a problem) and ⟦+:text⟧ (the fix) from code and
// returns the plain text with the range each mark covers.
function parseMarks(code) {
  const ranges = [];
  let plain = '';
  let index = 0;

  while (index < code.length) {
    const start = code.indexOf(open, index);

    if (start === -1) {
      plain += code.slice(index);
      break;
    }

    plain += code.slice(index, start);

    const colon = code.indexOf(':', start);
    const end = code.indexOf(close, colon);
    const label = code.slice(start + 1, colon);
    const text = code.slice(colon + 1, end);

    ranges.push({
      start: plain.length,
      end: plain.length + text.length,
      fix: label === '+',
    });

    plain += text;
    index = end + 1;
  }

  return {plain, ranges};
}

// renderLine cuts a line's tokens at mark boundaries and wraps what is inside.
function renderLine(tokens, lineStart, ranges, getTokenProps) {
  const out = [];
  let offset = lineStart;
  let open = null;
  let openItems = [];

  const flush = () => {
    if (open === null) {
      return;
    }

    out.push(
      <mark
        key={`m${open.start}`}
        className={clsx('ant-mark', open.fix ? 'ant-mark--fix' : 'ant-mark--pain')}>
        {openItems}
      </mark>,
    );
    open = null;
    openItems = [];
  };

  tokens.forEach((token, tokenIndex) => {
    let text = token.content;
    let cursor = offset;

    while (text.length > 0) {
      const inside = ranges.find((r) => cursor >= r.start && cursor < r.end);
      const next = ranges.find((r) => r.start > cursor);
      const stop = inside ? inside.end : next ? next.start : Infinity;
      const length = Math.min(text.length, stop - cursor);
      const piece = text.slice(0, length);
      const {key: _key, ...rest} = getTokenProps({token: {...token, content: piece}});

      if (inside && open?.start !== inside.start) {
        flush();
        open = inside;
      }

      if (!inside) {
        flush();
      }

      const item = <span key={`${tokenIndex}-${cursor}`} {...rest} />;

      if (inside) {
        openItems.push(item);
      } else {
        out.push(item);
      }

      text = text.slice(length);
      cursor += length;
    }

    offset += token.content.length;
  });

  flush();

  return out;
}

export default function MarkedCode({children, className, metastring}) {
  const language = className?.replace('language-', '') ?? 'text';
  const title = metastring?.match(/title="([^"]*)"/)?.[1];
  const source = typeof children === 'string' ? children.replace(/\n$/, '') : '';
  const {plain, ranges} = parseMarks(source);

  return (
    <div className="theme-code-block marked-code">
      {title && <div className="marked-code__title">{title}</div>}
      <Highlight code={plain} language={language} theme={antPrism}>
        {({tokens, getLineProps, getTokenProps}) => {
          let lineStart = 0;

          return (
            <pre className="marked-code__pre">
              <code>
                {tokens.map((line, i) => {
                  const {key: _key, ...lineProps} = getLineProps({line});
                  const start = lineStart;

                  lineStart += line.reduce((sum, t) => sum + t.content.length, 0) + 1;

                  return (
                    <span key={i} {...lineProps} className="token-line">
                      {renderLine(line, start, ranges, getTokenProps)}
                      {'\n'}
                    </span>
                  );
                })}
              </code>
            </pre>
          );
        }}
      </Highlight>
    </div>
  );
}
