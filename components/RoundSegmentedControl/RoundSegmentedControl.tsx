import { SegmentedControl } from "@mantine/core";
import classes from "./RoundSegmentedControl.module.css";

interface RoundSegmentedControlProps {
    value: string;
    onChange: (value: string) => void;
    data: { label: string; value: string }[];
}

export default function RoundSegmentedControl({
    value,
    onChange,
    data
}: RoundSegmentedControlProps) {
    return (
        <SegmentedControl
            value={value}
            onChange={onChange}
            data={data}
            className={classes.segmentedControlWrapper}
            classNames={{
                indicator: classes.segmentedIndicator,
                root: classes.segmentedRoot,
                control: classes.segmentedControlItem,
                label: classes.segmentedLabel
            }}
        />
    );
}