import { Button, Grid, Group, Modal } from "@mantine/core";
import ImageRadioGroup from "../ImageRadioGroup/ImageRadioGroup";
import { useState } from "react";
import { IconPencil } from "@tabler/icons-react";

interface EditImageModelProps {
    selectedJobImages: string[];
    editModalOpen: boolean;
    setEditModalOpen: (isOpen: boolean) => void;
    handleImageSelect: (imageUrl: string) => void;
}

export default function EditImageModel(props: EditImageModelProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <Modal size="auto" opened={props.editModalOpen} onClose={() => props.setEditModalOpen(false)} title="Select Image to Edit">
            <ImageRadioGroup
                images={props.selectedJobImages.map((url, index) => ({ imgUrl: url, imageId: `${index}` }))}
                onChange={setSelectedImage}
            ></ImageRadioGroup>
            <Group mt={10} justify="center">
                <Button
                    disabled={!!selectedImage}
                    rightSection={<IconPencil size={14} />}
                    onClick={() => props.handleImageSelect(props.selectedJobImages[+(selectedImage as string)])}>
                    Select and Edit
                </Button>
            </Group>
        </Modal>
    )
}