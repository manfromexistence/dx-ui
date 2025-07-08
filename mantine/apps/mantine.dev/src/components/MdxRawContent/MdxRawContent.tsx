import { MdxSiblings } from '@/components/MdxSiblings';
import { PageBase } from '@/components/PageBase';
import { TableOfContents } from '@/components/TableOfContents';
import { DOCS_BASE } from '@/links';
import { Frontmatter } from '@/types';
import classes from './MdxRawContent.module.css';

interface MdxRawContentProps {
  children: React.ReactNode;
  meta: Frontmatter;
}

export function MdxRawContent({ children, meta }: MdxRawContentProps) {
  return (
    <PageBase>
      <div className={classes.wrapper}>
        <div className={classes.container} id="mdx">
          {children}
          <MdxSiblings meta={meta} />
        </div>

        <div className={classes.tableOfContents}>
          <TableOfContents withTabs={false} editPageLink={`${DOCS_BASE}${meta.slug}.mdx`} />
        </div>
      </div>
    </PageBase>
  );
}
