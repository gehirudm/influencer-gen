import { Avatar, Checkbox, Group, Image, SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import classes from './ProjectCheckBox.module.css';
import { IconAt, IconCalendar, IconClock, IconPhoneCall, IconPhoto } from '@tabler/icons-react';
import TimeAgo from 'react-timeago'

interface ProjectCheckBoxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  title: string;
  imageCount: number;
  createdAt: Date;
  image: string;
}

export function ProjectCheckBox({
  checked,
  defaultChecked,
  onChange,
  title,
  imageCount,
  createdAt,
  className,
  image,
  ...others
}: ProjectCheckBoxProps & Omit<React.ComponentPropsWithoutRef<'button'>, keyof ProjectCheckBoxProps>) {
  const [value, handleChange] = useUncontrolled({
    value: checked,
    defaultValue: defaultChecked,
    finalValue: false,
    onChange,
  });

  return (
    <UnstyledButton
      {...others}
      onClick={() => handleChange(!value)}
      data-checked={value || undefined}
      className={classes.button}
    >
      <Group wrap="nowrap">
        <Avatar
          src={image}
          size={94}
          radius="md"
        />
        <div>
          <Text fz="lg" fw={500} className={classes.name} lineClamp={1} title={title}>
            {title}
          </Text>

          {/* <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            Software engineer
          </Text> */}

          <Group wrap="nowrap" gap={10} mt={3}>
            <IconClock stroke={1.5} size={16} className={classes.icon} />
            <Text fz="xs" c="dimmed">
              Created <TimeAgo date={createdAt} />
            </Text>
          </Group>

          <Group wrap="nowrap" gap={10} mt={5}>
            <IconPhoto stroke={1.5} size={16} className={classes.icon} />
            <Text fz="xs" c="dimmed">
              {imageCount} images
            </Text>
          </Group>
        </div>
      </Group>

      <Checkbox
        display="none"
        checked={value}
        onChange={() => { }}
        tabIndex={-1}
        styles={{ input: { cursor: 'pointer' } }}
      />
    </UnstyledButton>
  );
}