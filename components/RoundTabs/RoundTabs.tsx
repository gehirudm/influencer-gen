import { useState } from 'react';
import { Tabs, FloatingIndicator } from '@mantine/core';

import classes from './RoundTabs.module.css';

export default function RoundTabs({ tabs }: { tabs: { name: string, panel: React.ReactNode, value?: string }[] }) {
    if (tabs.length == 0) return;

    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [value, setValue] = useState<string | null>(tabs[0].value || '0');
    const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
    const setControlRef = (val: string) => (node: HTMLButtonElement) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    return (
        <Tabs variant="none" value={value} onChange={setValue}>
            <Tabs.List ref={setRootRef} className={classes.list}>
                {tabs.map(({ name, value }, index) => (
                    <Tabs.Tab key={`${index}`} value={value || `${index}`} ref={setControlRef(`${index}`)} className={classes.tab}>
                        {name}
                    </Tabs.Tab>
                ))}

                <FloatingIndicator
                    target={value ? controlsRefs[value] : null}
                    parent={rootRef}
                    className={classes.indicator}
                />
            </Tabs.List>

            {tabs.map(({ panel }, index) => (
                <Tabs.Panel key={`${index}`} value={`${index}`}>{panel}</Tabs.Panel>
            ))}
        </Tabs>
    );
}