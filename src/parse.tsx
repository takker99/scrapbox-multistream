import {
  CodeBlock as CodeBlockNode,
  DecorationNode,
  IconNode,
  Node as NodeType,
  parse,
  StrongIconNode,
  Table,
} from "https://cdn.skypack.dev/@progfay/scrapbox-parser@7.1.0?dts";
import type { Line } from "./types.ts";
import { Context, Image, JSXSlack, Section } from "https://esm.sh/jsx-slack";
import { toLc } from "./utils.ts";

JSXSlack.exactMode(true);

export function sb2blocks(project: string, title: string, lines: Line[]) {
  const blocks = parse(lines.map((line) => line.text).join("\n"), {
    hasTitle: false,
  });
  return blocks.map((block) => {
    switch (block.type) {
      case "title":
        return <>{block.text}</>;
      case "codeBlock":
        return <CodeBlock {...{ project, title, block }} />;
      case "table":
        return <TableBlock {...{ project, title, block }} />;
      case "line": {
        const renderedNodes = block.nodes.map((
          node,
        ) => (<Node project={project} title={title} node={node} />));

        // 画像記法は別立てにする
        if (
          renderedNodes.length === 1 &&
          renderedNodes[0].$$jsxslack.props?.alt === "image"
        ) {
          return renderedNodes[0];
        }
        return <Context>
          {renderedNodes}
        </Context>;
      }
    }
  });
}

type Props<T> = {
  project: string;
  title: string;
  block: T;
};

const CodeBlock = (
  { project, title, block: { fileName, content } }: Props<CodeBlockNode>,
) => (<Section>
  <a
    href={`https://scrapbox.io/api/code/${project}/${toLc(title)}/${
      toLc(fileName)
    }`}
  >
    {fileName}
  </a>
  <br />
  <pre>{content}</pre>
</Section>);

const TableBlock = (
  { project, title, block: { fileName, cells } }: Props<Table>,
) => (<Section>
  <a
    href={`https://scrapbox.io/api/table/${project}/${toLc(title)}/${
      toLc(fileName)
    }.csv`}
  >
    {fileName}
  </a>
  <br />
  {cells.map((cell) =>
    <>
      {cell.map((row) => row.map((node) => node.raw).join("")).join("　")}
      <br />
    </>
  )}
</Section>);

type NodeProps = {
  project: string;
  title: string;
  node: NodeType;
};

function Node(
  { project, title, node }: NodeProps,
) {
  switch (node.type) {
    case "quote":
      return <blockquote>
        {node.nodes.map((
          node,
        ) => (<Node project={project} title={title} node={node} />))}
      </blockquote>;
    case "strong":
      return <b>
        {node.nodes.map((
          node,
        ) => (<Node project={project} title={title} node={node} />))}
      </b>;
    case "image":
    case "strongImage":
      return <Image src={node.src} alt="image" />;
    case "icon":
    case "strongIcon":
      return <Icon project={project} {...node} />;
    case "decoration":
      return <Decoration project={project} title={title} {...node} />;
    case "code":
      return <code>{node.text}</code>;
    case "commandLine":
      return <code>{node.symbol} {node.text}</code>;
    case "helpfeel":
      return <code>? {node.text}</code>;
    case "formula":
      return <code>{node.formula}</code>;
    case "googleMap":
      return <a href={node.url}>{node.place}</a>;
    case "hashTag":
      return <a href={`https://scrapbox.io/${project}/${node.href}`}>
        #{node.href}
      </a>;
    case "plain":
    case "blank":
      return <>{node.text}</>;
    default:
      return <>{node.raw}</>;
  }
}

type IconProps = (IconNode | StrongIconNode) & {
  project: string;
};

const Icon = ({ pathType, path, project }: IconProps) => {
  if (pathType === "relative") {
    return <img src={`/${project}/${toLc(path)}`} alt={path} />;
  } else {
    const root = path.split("/")[1];
    const iconName = path.slice(`/${root}/`.length);
    return <img src={`/${root}/${toLc(iconName)}`} alt={iconName} />;
  }
};

type DecorationProps = DecorationNode & {
  project: string;
  title: string;
};

const Decoration = ({ decos, nodes, project, title }: DecorationProps) => {
  const hasStrong = decos.some((deco) => deco[0].startsWith("*-"));
  const hasItalic = decos.includes("/");
  const hasStrike = decos.includes("-");
  let renderedNodes = <>
    {nodes.map((node) => <Node node={node} project={project} title={title} />)}
  </>;
  if (hasStrong) renderedNodes = <b>{renderedNodes}</b>;
  if (hasItalic) renderedNodes = <i>{renderedNodes}</i>;
  if (hasStrike) renderedNodes = <s>{renderedNodes}</s>;
  return renderedNodes;
};
