import { useState } from 'react';
import { Tabs, FloatingIndicator } from '@mantine/core';

import classes from './RoundTabs.module.css';

export default function RoundTabs({ tabs, onChange, value }: { tabs: { name: string, panel: React.ReactNode, value: string }[], value: string, onChange: (value: string | null) => void }) {
    if (tabs.length == 0) return;

    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
    const setControlRef = (val: string) => (node: HTMLButtonElement) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    return (
        <Tabs variant="none" value={value} onChange={v => onChange(v)}>
            <Tabs.List ref={setRootRef} className={classes.list}>
                {tabs.map(({ name, value }, index) => (
                    <Tabs.Tab key={`${index}`} value={value} ref={setControlRef(value)} className={classes.tab}>
                        {name}
                    </Tabs.Tab>
                ))}

                <FloatingIndicator
                    target={value ? controlsRefs[value] : null}
                    parent={rootRef}
                    className={classes.indicator}
                />
            </Tabs.List>

            {tabs.map(({ panel, value }, index) => (
                <Tabs.Panel key={`${index}`} value={value}>{panel}</Tabs.Panel>
            ))}
        </Tabs>
    );
}