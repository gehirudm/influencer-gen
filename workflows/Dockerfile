# clean base image containing only comfyui, comfy-cli and comfyui-manager
FROM runpod/worker-comfyui:5.8.5-base

# install custom nodes into comfyui (first node with --mode remote to fetch updated cache)
# RUN comfy node install --mode remote https://github.com/a-und-b/ComfyUI_LoRA_from_URL.git

RUN comfy node install --mode remote https://github.com/Lightricks/ComfyUI-LTXVideo.git

# -------------------------------------------------------------------
# LTX Video checkpoint model (~27.4 GB)
# -------------------------------------------------------------------
RUN comfy model download \
  --url https://huggingface.co/Lightricks/LTX-2.3/resolve/main/ltx-2.3-22b-dev.safetensors \
  --relative-path models/checkpoints \
  --filename ltx-2.3-22b-dev.safetensors

# -------------------------------------------------------------------
# Gemma 3 text encoder (~8.8 GB)
# -------------------------------------------------------------------
RUN comfy model download \
  --url https://huggingface.co/DreamFast/gemma-3-12b-it-heretic/resolve/main/comfyui/gemma_3_12B_it_heretic.safetensors \
  --relative-path models/text_encoders \
  --filename gemma_3_12B_it_heretic.safetensors

# -------------------------------------------------------------------
# hxwoman LoRAs (~643 MB each)
# -------------------------------------------------------------------
# RUN comfy model download \
#   --url https://huggingface.co/nimsith799/LoRa_aiofm/resolve/main/hxwoman_lora_v1_000004000.safetensors \
#   --relative-path models/loras \
#   --filename hxwoman_lora_v1_000004000.safetensors

# RUN comfy model download \
#   --url https://huggingface.co/nimsith799/LoRa_aiofm/resolve/main/hxwoman_lora_v1_000005500.safetensors \
#   --relative-path models/loras \
#   --filename hxwoman_lora_v1_000005500.safetensors

RUN comfy model download \
  --url https://huggingface.co/nimsith799/LoRa_aiofm/resolve/main/hxwoman_lora_v1_FINAL.safetensors \
  --relative-path models/loras \
  --filename hxwoman_lora_v1_FINAL.safetensors

# copy all input data (like images or videos) into comfyui (uncomment and adjust if needed)
# COPY input/ /comfyui/input/
