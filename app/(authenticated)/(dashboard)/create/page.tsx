"use client"

import { useState } from 'react';
import { Grid, TextInput, Button, Group, NumberInput, Slider, Select, Stack, Title, Paper, SegmentedControl, Tooltip, Text, ScrollArea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useUserJobs } from '@/hooks/useUserJobs';
import { useUserProjects } from '@/hooks/useUserProjects';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import EditImageModel from '@/components/Models/EditImageModel';
import { GenJobCard } from '@/components/GenJobCard/GenJobCard';

// Aspect ratio presets with their dimensions
const aspectRatios = [
	{ value: 'portrait', label: 'Portrait (2:3)', width: 800, height: 1200 },
	{ value: 'instagram', label: 'Instagram (4:5)', width: 864, height: 1080 },
	{ value: 'square', label: 'Square (1:1)', width: 1024, height: 1024 },
	{ value: 'landscape', label: 'Landscape (3:2)', width: 1200, height: 800 },
];

export default function ImageGeneratorPage() {
	const form = useForm({
		initialValues: {
			prompt: '',
			negative_prompt: '',
			aspectRatio: 'portrait',
			steps: 30,
			cfg_scale: 3,
			seed: '',
			batch_size: 1,
			solver_order: 2 as 2 | 3,
			strength: 0.75,
			model_name: 'realism' as 'lustify' | 'realism',
		},
		validate: {
			prompt: (value) => value.trim().length === 0 ? 'Prompt is required' : null,
			batch_size: (value) => value < 1 || value > 4 ? 'Batch size must be between 1 and 4' : null,
			strength: (value) => value < 0 || value > 1 ? 'Strength must be between 0 and 1' : null,
		}
	});

	const { jobs: userJobs, deleteJob } = useUserJobs();
	const { projects: userProjects } = useUserProjects();
	const [loading, setLoading] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [selectedJobImages, setSelectedJobImages] = useState<string[]>([]);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [maskImage, setMaskImage] = useState<string | null>(null);
	const [imageLoading, setImageLoading] = useState(false);

	// Get dimensions based on selected aspect ratio
	const getDimensions = () => {
		const selected = aspectRatios.find(ratio => ratio.value === form.values.aspectRatio);
		return selected ? { width: selected.width, height: selected.height } : { width: 800, height: 1200 };
	};

	// Get aspect ratio string from dimensions
	const getAspectRatioString = (width: number, height: number) => {
		const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
		const divisor = gcd(width, height);
		return `${width / divisor}:${height / divisor}`;
	};

	const handleGenerate = async () => {
		const { width, height } = getDimensions();
		setLoading(true);

		try {
			// Prepare request payload
			const payload: Partial<ImageGenerationRequestInput> = {
				prompt: form.values.prompt,
				negative_prompt: form.values.negative_prompt || undefined,
				width,
				height,
				steps: form.values.steps,
				cfg_scale: form.values.cfg_scale,
				seed: form.values.seed ? Number(form.values.seed) : undefined,
				batch_size: form.values.batch_size,
				solver_order: form.values.solver_order,
				model_name: form.values.model_name,
			};

			// Add base image if selected
			if (selectedImage) {
				payload.base_img = selectedImage;
				payload.strength = form.values.strength;
			}

			// Add mask image if selected
			if (maskImage) {
				payload.mask_img = maskImage;
			}

			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to generate image');
			}

			const data = await response.json();

			notifications.show({
				title: 'Success',
				message: 'Image generation started successfully!',
				color: 'green'
			});

			// Reset form if needed
			// form.reset();
			// setSelectedImage(null);
			// setMaskImage(null);
		} catch (error: any) {
			console.error('Error generating image:', error);
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to generate image',
				color: 'red'
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (jobId: string) => {
		const job = userJobs.find(job => job.id === jobId);
		if (job && job.imageUrls) {
			setSelectedJobImages(job.imageUrls);
			setEditModalOpen(true);
		}
	};

	const handleImageSelect = async (imageUrl: string) => {
		setImageLoading(true);
		setEditModalOpen(false);
		try {
			const response = await fetch(imageUrl);
			const blob = await response.blob();
			const reader = new FileReader();

			reader.onloadend = () => {
				const dataUrl = reader.result as string;
				setSelectedImage(dataUrl);
			};

			reader.readAsDataURL(blob);
		} catch (error) {
			console.error('Error fetching image data URL:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to load image data.',
				color: 'red',
			});
		} finally {
			setImageLoading(false);
		}
	};

	const handleRecreate = (job: any) => {
		// Pre-fill form with job settings
		if (job && job.metadata) {
			const { prompt, negative_prompt, width, height, steps, cfg_scale, batch_size, model_name } = job.metadata;

			// Find matching aspect ratio or default to portrait
			let aspectRatio = 'portrait';
			for (const ratio of aspectRatios) {
				if (ratio.width === width && ratio.height === height) {
					aspectRatio = ratio.value;
					break;
				}
			}

			form.setValues({
				prompt,
				negative_prompt: negative_prompt || '',
				aspectRatio,
				steps,
				cfg_scale,
				batch_size,
				model_name: model_name || 'realism',
				seed: '',
				solver_order: job.metadata.solver_order || 2,
				strength: 0.75,
			});

			// Scroll to form
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handleInpaint = async (job: any) => {
		if (job && job.imageUrls && job.imageUrls.length > 0) {
			// Set the first image as base image
			await handleImageSelect(job.imageUrls[0]);

			// Pre-fill form with job settings
			if (job.metadata) {
				const { prompt, negative_prompt, width, height, steps, cfg_scale, batch_size, model_name } = job.metadata;

				// Find matching aspect ratio or default to portrait
				let aspectRatio = 'portrait';
				for (const ratio of aspectRatios) {
					if (ratio.width === width && ratio.height === height) {
						aspectRatio = ratio.value;
						break;
					}
				}

				form.setValues({
					prompt,
					negative_prompt: negative_prompt || '',
					aspectRatio,
					steps,
					cfg_scale,
					batch_size,
					model_name: model_name || 'realism',
					seed: '',
					solver_order: job.metadata.solver_order || 2,
					strength: 0.5, // Set a moderate strength for inpainting
				});

				// Scroll to form
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}
	};

	const handleAddToProject = (job: any) => {
		// Implementation would be similar to the ImageGenCard's project modal
		// For now, just show a notification
		notifications.show({
			title: 'Feature Coming Soon',
			message: 'Add to project functionality will be available soon.',
			color: 'blue'
		});
	};

	const handleRecheckStatus = (job: any) => {
		notifications.show({
			title: 'Checking Status',
			message: 'Rechecking job status...',
			loading: true,
			autoClose: 2000,
		});

		// Actual implementation would involve checking the job status from the server
	};

	return (
		<>
			<Grid>
				<Grid.Col span={5}>
					<Paper withBorder p="md" radius="md">
						<form onSubmit={form.onSubmit(handleGenerate)}>
							<Stack gap="md">
								<Title order={3}>Image Generation</Title>

								{/* Basic Settings */}
								<TextInput
									label="Image Prompt"
									placeholder="A beautiful portrait of a woman with long hair"
									required
									{...form.getInputProps('prompt')}
								/>

								<TextInput
									label="Negative Prompt"
									placeholder="ugly, distorted, low quality"
									{...form.getInputProps('negative_prompt')}
								/>

								<Select
									label="Model"
									data={[
										{ value: 'realism', label: 'Realism' },
										{ value: 'lustify', label: 'Lustify' }
									]}
									{...form.getInputProps('model_name')}
								/>

								<SegmentedControl
									fullWidth
									data={aspectRatios.map(ratio => ({
										value: ratio.value,
										label: ratio.label
									}))}
									{...form.getInputProps('aspectRatio')}
								/>

								{/* Advanced Settings */}
								<Title order={4}>Advanced Settings</Title>

								<NumberInput
									label="Batch Size"
									description="Number of images to generate (1-4)"
									min={1}
									max={4}
									{...form.getInputProps('batch_size')}
								/>

								<Tooltip label="Higher values make the image follow the prompt more closely">
									<Stack gap={0}>
										<Text size="sm">CFG Scale ({form.values.cfg_scale})</Text>
										<Slider
											min={1}
											max={15}
											step={0.5}
											{...form.getInputProps('cfg_scale')}
										/>
									</Stack>
								</Tooltip>

								<Tooltip label="More steps generally produce higher quality images but take longer">
									<Stack gap={0}>
										<Text size="sm">Steps ({form.values.steps})</Text>
										<Slider
											min={10}
											max={50}
											step={1}
											{...form.getInputProps('steps')}
										/>
									</Stack>
								</Tooltip>

								<TextInput
									label="Seed"
									description="Leave empty for random seed"
									placeholder="e.g. 42"
									{...form.getInputProps('seed')}
								/>

								<Select
									label="Solver Order"
									data={[
										{ value: '2', label: 'DPM++ 2M' },
										{ value: '3', label: 'DPM++ 3M' }
									]}
									{...form.getInputProps('solver_order')}
								/>

								{/* Image to Image Settings */}
								{selectedImage && (
									<Tooltip label="How much to transform the base image (0 = no change, 1 = complete change)">
										<Stack gap={0}>
											<Text size="sm">Transformation Strength ({form.values.strength.toFixed(2)})</Text>
											<Slider
												min={0}
												max={1}
												step={0.05}
												{...form.getInputProps('strength')}
											/>
										</Stack>
									</Tooltip>
								)}

								<Title order={4}>Base Image</Title>
								<FileDropzonePreview
									selectedImage={selectedImage}
									setSelectedImage={setSelectedImage}
									loading={imageLoading}
									label="Upload base image for img2img generation"
								/>

								{/* TODO: Add mask image support if needed */}

								<Button
									type="submit"
									loading={loading}
									size="lg"
									fullWidth
								>
									Generate Image
								</Button>
							</Stack>
						</form>
					</Paper>
				</Grid.Col>

				<Grid.Col span={7}>
					<Group>
						{userJobs.map((job, index) => {
							// Calculate aspect ratio string
							const width = job.metadata?.width || 512;
							const height = job.metadata?.height || 512;
							const aspectRatio = getAspectRatioString(width, height);

							return (
								<GenJobCard
									key={job.id}
									prompt={job.metadata?.prompt || ""}
									status={job.status}
									imageUrls={job.imageUrls || []}
									generationTime={job.executionTime ? job.executionTime / 1000 : undefined}
									dimensions={{ width, height }}
									aspectRatio={aspectRatio}
									batchSize={job.metadata?.batch_size || 1}
									userProjects={userProjects}
									onEdit={() => handleEdit(job.id)}
									onRecreate={() => handleRecreate(job)}
									onInpaint={() => handleInpaint(job)}
									onAddToProject={() => handleAddToProject(job)}
									onRecheckStatus={() => handleRecheckStatus(job)}
									onDelete={() => deleteJob(job.id)}
								/>
							);
						})}
					</Group>
				</Grid.Col>
			</Grid>

			<EditImageModel
				selectedJobImages={selectedJobImages}
				editModalOpen={editModalOpen}
				setEditModalOpen={setEditModalOpen}
				handleImageSelect={handleImageSelect}
			/>
		</>
	);
}