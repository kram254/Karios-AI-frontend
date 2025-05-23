import React, { useState, useEffect, useCallback } from "react";
import { Agent, AgentRole, AgentMode, AgentConfig } from "../../types/agent";
import { useNavigate } from "react-router-dom";
import "./AgentCreationWizard.css";
import "./dropdownFix.css";
import { KnowledgeSelector } from "../knowledge/KnowledgeSelector";

// Material UI components
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";

// Material UI icons
import CloseIcon from "@mui/icons-material/Close";
import LanguageIcon from "@mui/icons-material/Language";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";

// Define the props interface
interface AgentCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onDataChange: (data: Partial<Agent>) => void;
  onKnowledgeSelect: (ids: number[]) => void;
  onSubmit: (agentData: Partial<Agent>) => void;
  initialData?: Partial<Agent>;
}

// Define the step interface
interface Step {
  label: string;
  description: string;
}

// Steps for the wizard
const STEPS: Step[] = [
  { label: "Basic Info", description: "Name and description of your agent" },
  { label: "Role & Behavior", description: "Define how your agent interacts" },
  { label: "Knowledge Base", description: "Select knowledge for your agent" },
  {
    label: "Agent Actions",
    description: "Choose actions your agent can perform",
  },
  { label: "Review", description: "Review your agent before creation" },
];

export default function AgentCreationWizard({
  open,
  onClose,
  onDataChange,
  onKnowledgeSelect,
  onSubmit,
  initialData,
}: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Agent>>(
    initialData || {
      actions: [],
      ai_role: AgentRole.CUSTOMER_SUPPORT,
      language: "en",
      mode: AgentMode.TEXT,
      response_style: 0.5,
      response_length: 150,
    }
  );

  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>(
    []
  );
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [modeSelectOpen, setModeSelectOpen] = useState(false);
  const [languageSelectOpen, setLanguageSelectOpen] = useState(false);
  const [customRole, setCustomRole] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle opening the modal
  useEffect(() => {
    console.log("Modal open state:", open);
    // Reset the wizard to step 1 whenever it's opened
    if (open) {
      setCurrentStep(1);
      // Reset form data to initial state
      setFormData(
        initialData || {
          actions: [],
          ai_role: AgentRole.CUSTOMER_SUPPORT,
          language: "en",
          mode: AgentMode.TEXT,
          response_style: 0.5,
          response_length: 150,
        }
      );
      setSelectedKnowledgeIds([]);
      setCustomRole(false);
      setIsLoading(false);
    }
  }, [open, initialData]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // If there are knowledge item IDs, update the selected knowledge IDs
      if (initialData.config?.knowledge_item_ids) {
        setSelectedKnowledgeIds(initialData.config.knowledge_item_ids);
      } else if (initialData.knowledge_items) {
        // Extract IDs from knowledge_items if available
        const knowledgeIds = initialData.knowledge_items.map((item) => item.id);
        setSelectedKnowledgeIds(knowledgeIds);
      }
    }
  }, [initialData]);

  // Function to handle input changes
  const handleInputChange = (field: keyof Agent, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onDataChange(updatedData);
  };

  // Function to handle submit
  const handleSubmit = () => {
    setIsLoading(true);

    // Create a valid config object with all required fields from the AgentConfig interface
    const configUpdate: AgentConfig = {
      // These fields are required according to the AgentConfig interface
      language: formData.language || "en", // Default to English if not set
      mode: formData.mode || AgentMode.TEXT, // Default to TEXT mode if not set
      response_style:
        typeof formData.response_style === "number"
          ? formData.response_style
          : 0.5,
      response_length:
        typeof formData.response_length === "number"
          ? formData.response_length
          : 150,
      // Optional fields
      model: formData.config?.model,
      temperature: formData.config?.temperature,
      max_tokens: formData.config?.max_tokens,
      knowledge_item_ids: selectedKnowledgeIds,
      actions: formData.actions,
      system_prompt: formData.config?.system_prompt,
      webhook_url: formData.config?.webhook_url,
      additional_context: formData.config?.additional_context,
    };

    // Create a copy of the form data with the updated config
    const updatedData: Partial<Agent> = {
      ...formData,
      config: configUpdate,
    };

    onSubmit(updatedData);
  };

  // Function to go to the next step
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Function to go to the previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle opening the custom role input if "Custom" is selected
  useEffect(() => {
    if (formData.ai_role === AgentRole.CUSTOM) {
      setCustomRole(true);
    } else {
      setCustomRole(false);
    }
  }, [formData.ai_role]);

  // Add console logs for debugging
  useEffect(() => {
    console.log("AgentCreationWizard - currentStep:", currentStep);
    console.log("AgentCreationWizard - formData:", formData);
    console.log(
      "AgentCreationWizard - selectedKnowledgeIds:",
      selectedKnowledgeIds
    );
  }, [currentStep, formData, selectedKnowledgeIds]);

  // Monitor component lifecycle
  useEffect(() => {
    console.log("AgentCreationWizard mounted");
    console.log("AgentCreationWizard open state:", open);
    console.log("Current step:", currentStep);
    console.log("Current form data:", formData);

    const handleBeforeUnload = () => {
      console.log("Page is being unloaded");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      console.log("AgentCreationWizard unmounted");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [open, currentStep, formData]);

  // Function to validate the current step
  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.name && formData.name.length > 0;
      case 2:
        return !!formData.ai_role && !!formData.mode;
      case 3:
        return true; // Knowledge selection is optional
      case 4:
        return true; // Actions step is always valid
      case 5:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  // Function to handle changes to agent actions
  const handleActionChange = (actionId: string, checked: boolean) => {
    const currentActions = formData.actions || [];
    let updatedActions;

    if (checked) {
      updatedActions = [...currentActions, actionId];
    } else {
      updatedActions = currentActions.filter((id) => id !== actionId);
    }

    handleInputChange("actions", updatedActions);
  };

  // Function to check if an action is selected
  const isActionSelected = (actionId: string): boolean => {
    return (formData.actions || []).includes(actionId);
  };

  // Render using Material-UI Modal
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="agent-creation-wizard-title"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        },
      }}
    >
      <Paper
        sx={{
          backgroundColor: "#1e1e1e",
          color: "#FFFFFF",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Wizard Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid #333",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: "bold", color: "#FFFFFF" }}
          >
            {currentStep === STEPS.length
              ? "Create New Agent"
              : `Create New Agent: ${STEPS[currentStep - 1].label}`}
          </Typography>
          <IconButton
            onClick={onClose}
            size="large"
            sx={{
              color: "#AAAAAA",
              "&:hover": {
                color: "#FFFFFF",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Steps indicator */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 2,
            mb: 2,
          }}
        >
          {STEPS.map((step, index) => (
            <Box
              key={step.label}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: `${100 / STEPS.length}%`,
                px: 1,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: 70,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                  backgroundColor:
                    currentStep === index + 1
                      ? "rgba(0, 243, 255, 0.1)"
                      : "#222",
                  color:
                    currentStep === index + 1
                      ? "#00F3FF"
                      : currentStep > index + 1
                      ? "#FFFFFF"
                      : "#AAAAAA",
                  border:
                    currentStep === index + 1 ? "1px solid #00F3FF" : "none",
                  position: "relative",
                  overflow: "hidden",
                  fontWeight: currentStep === index + 1 ? "bold" : "normal",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  {index + 1}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      currentStep === index + 1
                        ? "#00F3FF"
                        : currentStep > index + 1
                        ? "#FFFFFF"
                        : "#AAAAAA",
                    textAlign: "center",
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {currentStep === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#FFFFFF" }}>
                Basic Information
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: "#AAAAAA" }}>
                Provide a name and description for your agent.
              </Typography>

              <TextField
                fullWidth
                required
                label="Agent Name"
                variant="outlined"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                margin="normal"
                InputLabelProps={{
                  style: { color: "#AAAAAA" },
                  shrink: true,
                }}
                InputProps={{
                  style: { color: "#FFFFFF" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.7)",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                margin="normal"
                multiline
                rows={4}
                InputLabelProps={{
                  style: { color: "#AAAAAA" },
                  shrink: true,
                }}
                InputProps={{
                  style: { color: "#FFFFFF" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.7)",
                    },
                  },
                }}
              />
            </Box>
          )}

          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: "#FFFFFF" }}>
                Role & Behavior
              </Typography>

              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel
                  id="agent-role-label"
                  sx={{
                    color: "#AAAAAA",
                    bgcolor: "#1e1e1e",
                    px: 1,
                    ml: -0.5,
                    zIndex: 1,
                  }}
                >
                  Agent Role
                </InputLabel>
                <Select
                  labelId="agent-role-label"
                  value={formData.ai_role || ""}
                  onChange={(e) => handleInputChange("ai_role", e.target.value)}
                  open={roleSelectOpen}
                  onOpen={() => setRoleSelectOpen(true)}
                  onClose={() => setRoleSelectOpen(false)}
                  MenuProps={{
                    disablePortal: false,
                    container: document.body,
                    PaperProps: {
                      sx: {
                        bgcolor: "#333",
                        color: "#FFFFFF",
                        "& .MuiMenuItem-root:hover": {
                          bgcolor: "rgba(0, 243, 255, 0.08)",
                        },
                        "& .MuiMenuItem-root.Mui-selected": {
                          bgcolor: "rgba(0, 243, 255, 0.15)",
                        },
                        maxHeight: 300,
                        overflow: "auto",
                        mt: 1,
                      },
                    },
                    slotProps: {
                      paper: {
                        elevation: 8,
                        sx: { zIndex: 9999 },
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  }}
                  sx={{
                    bgcolor: "#333",
                    color: "#FFFFFF",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "#555",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.7)",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#FFFFFF",
                    },
                  }}
                >
                  <MenuItem value={AgentRole.CUSTOMER_SUPPORT}>
                    Customer Support
                  </MenuItem>
                  <MenuItem value={AgentRole.SALES_ASSISTANT}>
                    Sales Assistant
                  </MenuItem>
                  <MenuItem value={AgentRole.TECHNICAL_SUPPORT}>
                    Technical Support
                  </MenuItem>
                  <MenuItem value={AgentRole.CONSULTING}>
                    Consulting Services
                  </MenuItem>
                  <MenuItem value={AgentRole.SALES_SERVICES}>
                    Sales Services
                  </MenuItem>
                  <MenuItem value={AgentRole.CUSTOM}>Custom...</MenuItem>
                </Select>
                {formData.ai_role === AgentRole.CUSTOM && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Custom Role"
                    placeholder="Enter custom role..."
                    value={formData.custom_role || ""}
                    onChange={(e) =>
                      handleInputChange("custom_role", e.target.value)
                    }
                    sx={{
                      mt: 1,
                      ".MuiOutlinedInput-root": {
                        color: "#FFFFFF",
                        bgcolor: "#333",
                        ".MuiOutlinedInput-notchedOutline": {
                          borderColor: "#555",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#00F3FF",
                          boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#00F3FF",
                          boxShadow: "0 0 8px rgba(0, 243, 255, 0.7)",
                        },
                      },
                      ".MuiInputLabel-root": {
                        color: "#AAAAAA",
                      },
                    }}
                  />
                )}
              </FormControl>

              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel
                  id="agent-mode-label"
                  sx={{
                    color: "#AAAAAA",
                    bgcolor: "#1e1e1e",
                    px: 1,
                    ml: -0.5,
                    zIndex: 1,
                  }}
                >
                  Interaction Mode
                </InputLabel>
                <Select
                  labelId="agent-mode-label"
                  value={formData.mode || ""}
                  onChange={(e) => handleInputChange("mode", e.target.value)}
                  open={modeSelectOpen}
                  onOpen={() => setModeSelectOpen(true)}
                  onClose={() => setModeSelectOpen(false)}
                  MenuProps={{
                    disablePortal: false,
                    container: document.body,
                    PaperProps: {
                      sx: {
                        bgcolor: "#333",
                        color: "#FFFFFF",
                        "& .MuiMenuItem-root:hover": {
                          bgcolor: "rgba(0, 243, 255, 0.08)",
                        },
                        "& .MuiMenuItem-root.Mui-selected": {
                          bgcolor: "rgba(0, 243, 255, 0.15)",
                        },
                        maxHeight: 300,
                        overflow: "auto",
                        mt: 1,
                      },
                    },
                    slotProps: {
                      paper: {
                        elevation: 8,
                        sx: { zIndex: 9999 },
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  }}
                  sx={{
                    bgcolor: "#333",
                    color: "#FFFFFF",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "#555",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.7)",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#FFFFFF",
                    },
                    "&:hover": {
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                  }}
                >
                  <MenuItem value={AgentMode.TEXT}>Text Only</MenuItem>
                  <MenuItem value={AgentMode.AUDIO}>Audio Enabled</MenuItem>
                  <MenuItem value={AgentMode.VIDEO}>Video Enabled</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel
                  id="agent-language-label"
                  sx={{
                    color: "#AAAAAA",
                    bgcolor: "#1e1e1e",
                    px: 1,
                    ml: -0.5,
                    zIndex: 1,
                  }}
                >
                  Language
                </InputLabel>
                <Select
                  labelId="agent-language-label"
                  value={formData.language || "en"}
                  onChange={(e) =>
                    handleInputChange("language", e.target.value)
                  }
                  open={languageSelectOpen}
                  onOpen={() => setLanguageSelectOpen(true)}
                  onClose={() => setLanguageSelectOpen(false)}
                  startAdornment={
                    <InputAdornment position="start">
                      <Tooltip title="Select the language the agent will use to interact with users">
                        <IconButton edge="start" size="small">
                          <LanguageIcon
                            sx={{ color: "#00F3FF", fontSize: "1.2rem" }}
                          />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  }
                  MenuProps={{
                    disablePortal: false,
                    container: document.body,
                    PaperProps: {
                      sx: {
                        bgcolor: "#333",
                        color: "#FFFFFF",
                        "& .MuiMenuItem-root:hover": {
                          bgcolor: "rgba(0, 243, 255, 0.08)",
                        },
                        "& .MuiMenuItem-root.Mui-selected": {
                          bgcolor: "rgba(0, 243, 255, 0.15)",
                        },
                        maxHeight: 300,
                        overflow: "auto",
                        mt: 1,
                      },
                    },
                    slotProps: {
                      paper: {
                        elevation: 8,
                        sx: { zIndex: 9999 },
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  }}
                  sx={{
                    bgcolor: "#333",
                    color: "#FFFFFF",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "#555",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00F3FF",
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.7)",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#FFFFFF",
                    },
                    "&:hover": {
                      boxShadow: "0 0 8px rgba(0, 243, 255, 0.5)",
                    },
                  }}
                >
                  <MenuItem value="en">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/en.png"
                        alt="English"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      English
                    </Box>
                  </MenuItem>
                  <MenuItem value="es">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/es.png"
                        alt="Spanish"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      Spanish
                    </Box>
                  </MenuItem>
                  <MenuItem value="fr">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/fr.png"
                        alt="French"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      French
                    </Box>
                  </MenuItem>
                  <MenuItem value="de">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/de.png"
                        alt="German"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      German
                    </Box>
                  </MenuItem>
                  <MenuItem value="it">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/it.png"
                        alt="Italian"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      Italian
                    </Box>
                  </MenuItem>
                  <MenuItem value="pt">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/pt.png"
                        alt="Portuguese"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      Portuguese
                    </Box>
                  </MenuItem>
                  <MenuItem value="ru">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src="/flags/ru.png"
                        alt="Russian"
                        width={20}
                        height={15}
                        style={{ marginRight: 8 }}
                      />
                      Russian
                    </Box>
                  </MenuItem>
                </Select>
                <FormHelperText sx={{ color: "#AAAAAA" }}>
                  The agent will respond in this language
                </FormHelperText>
              </FormControl>

              <Box sx={{ mt: 4, width: "100%" }}>
                <Typography
                  id="response-style-slider-label"
                  gutterBottom
                  sx={{ color: "#FFFFFF" }}
                >
                  Response Style
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    px: "11px", // ✅ Changed from `mx` to `px` to apply equal horizontal padding
                    width: "100%", // ✅ Let it inherit the full width but respect internal padding
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#AAAAAA" }}>
                    Formal
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#AAAAAA" }}>
                    Casual
                  </Typography>
                </Box>

                <Slider
                  aria-labelledby="response-style-slider-label"
                  value={formData.response_style || 0.5}
                  onChange={(_, value) =>
                    handleInputChange("response_style", value as number)
                  }
                  step={0.25}
                  marks
                  min={0}
                  max={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) =>
                    value === 0
                      ? "Very Formal"
                      : value === 0.25
                      ? "Formal"
                      : value === 0.5
                      ? "Balanced"
                      : value === 0.75
                      ? "Casual"
                      : "Very Casual"
                  }
                  sx={{
                    width: "100%",
                    color: "#00F3FF",
                    "& .MuiSlider-rail": {
                      opacity: 0.5,
                      backgroundColor: "#333",
                    },
                    "& .MuiSlider-mark": {
                      backgroundColor: "#555",
                      height: 8,
                      width: 1,
                      marginTop: -3,
                    },
                    "& .MuiSlider-thumb": {
                      width: 22,
                      height: 22,
                      backgroundColor: "#00F3FF",
                      "&:before": {
                        boxShadow: "0 4px 8px rgba(0, 243, 255, 0.4)",
                      },
                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: "0 0 0 8px rgba(0, 243, 255, 0.16)",
                      },
                    },
                    "& .MuiSlider-valueLabel": {
                      backgroundColor: "#00F3FF",
                      color: "#000",
                    },
                  }}
                />
              </Box>

              <Box sx={{ mt: 4, width: "100%" }}>
                <Typography
                  id="response-length-slider-label"
                  gutterBottom
                  sx={{ color: "#FFFFFF" }}
                >
                  Response Length (words)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    mx: 1.4, // Add margin to match slider track exactly
                    width: "calc(100% - 22px)", // Subtract thumb width to align with slider track
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#AAAAAA" }}>
                    Short
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#AAAAAA" }}>
                    Long
                  </Typography>
                </Box>
                <Slider
                  aria-labelledby="response-length-slider-label"
                  value={formData.response_length || 150}
                  onChange={(_, value) =>
                    handleInputChange("response_length", value as number)
                  }
                  step={50}
                  marks
                  min={50}
                  max={350}
                  valueLabelDisplay="auto"
                  sx={{
                    width: "100%",
                    color: "#00F3FF",
                    "& .MuiSlider-rail": {
                      opacity: 0.5,
                      backgroundColor: "#333",
                    },
                    "& .MuiSlider-mark": {
                      backgroundColor: "#555",
                      height: 8,
                      width: 1,
                      marginTop: -3,
                    },
                    "& .MuiSlider-thumb": {
                      width: 22,
                      height: 22,
                      backgroundColor: "#00F3FF",
                      "&:before": {
                        boxShadow: "0 4px 8px rgba(0, 243, 255, 0.4)",
                      },
                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: "0 0 0 8px rgba(0, 243, 255, 0.16)",
                      },
                    },
                    "& .MuiSlider-valueLabel": {
                      backgroundColor: "#00F3FF",
                      color: "#000",
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {currentStep === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#FFFFFF" }}>
                Knowledge Base
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: "#AAAAAA" }}>
                Select knowledge sources your agent can reference when answering
                questions.
              </Typography>

              <KnowledgeSelector
                selectedIds={selectedKnowledgeIds}
                onSelectionChange={(ids: number[]) => {
                  setSelectedKnowledgeIds(ids);
                  onKnowledgeSelect(ids);
                }}
              />
            </Box>
          )}

          {currentStep === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: "#FFFFFF" }}>
                Agent Actions
              </Typography>

              <Typography variant="body2" paragraph sx={{ color: "#AAAAAA" }}>
                Select what actions this agent can perform:
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.25,
                    bgcolor: "#333",
                    borderRadius: 1,
                  }}
                >
                  <Checkbox
                    checked={true}
                    disabled
                    sx={{
                      color: "#AAAAAA",
                      "&.Mui-checked": {
                        color: "#00F3FF",
                      },
                    }}
                  />
                  <Box sx={{ ml: 1 }}>
                    <Typography sx={{ fontWeight: "bold", color: "#fff" }}>
                      Text Output
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.25,
                    bgcolor: "#333",
                    borderRadius: 1,
                  }}
                >
                  <Checkbox
                    checked={isActionSelected("send_file")}
                    onChange={(e) =>
                      handleActionChange("send_file", e.target.checked)
                    }
                    sx={{
                      color: "#AAAAAA",
                      "&.Mui-checked": {
                        color: "#00F3FF",
                      },
                    }}
                  />
                  <Box sx={{ ml: 1 }}>
                    <Typography sx={{ fontWeight: "bold", color: "#fff" }}>
                      Send File
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.25,
                    bgcolor: "#333",
                    borderRadius: 1,
                  }}
                >
                  <Checkbox
                    checked={isActionSelected("send_link")}
                    onChange={(e) =>
                      handleActionChange("send_link", e.target.checked)
                    }
                    sx={{
                      color: "#AAAAAA",
                      "&.Mui-checked": {
                        color: "#00F3FF",
                      },
                    }}
                  />
                  <Box sx={{ ml: 1 }}>
                    <Typography sx={{ fontWeight: "bold", color: "#fff" }}>
                      Send Link
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {currentStep === 5 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#FFFFFF" }}>
                Review Agent Configuration
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: "#AAAAAA" }}>
                Review your agent configuration before creating it.
              </Typography>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  borderRadius: 2,
                  mt: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#00F3FF", mb: 2 }}
                >
                  Basic Information
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#AAAAAA", width: "30%" }}
                    >
                      Name:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#FFFFFF", width: "70%" }}
                    >
                      {formData.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#AAAAAA", width: "30%" }}
                    >
                      Description:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#FFFFFF", width: "70%" }}
                    >
                      {formData.description || "N/A"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#AAAAAA", width: "30%" }}
                    >
                      Role:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#FFFFFF", width: "70%" }}
                    >
                      {formData.ai_role}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#AAAAAA", width: "30%" }}
                    >
                      Mode:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#FFFFFF", width: "70%" }}
                    >
                      {formData.mode}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  borderRadius: 2,
                  mt: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#00F3FF", mb: 2 }}
                >
                  Response Configuration
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#AAAAAA", width: "30%" }}
                    >
                      Response Style:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#FFFFFF", width: "70%" }}
                    >
                      {formData.response_style === 0
                        ? "Very Formal"
                        : formData.response_style === 0.25
                        ? "Formal"
                        : formData.response_style === 0.5
                        ? "Balanced"
                        : formData.response_style === 0.75
                        ? "Casual"
                        : "Very Casual"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#AAAAAA", width: "30%" }}
                    >
                      Response Length:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#FFFFFF", width: "70%" }}
                    >
                      {formData.response_length} words
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  borderRadius: 2,
                  mt: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#00F3FF", mb: 2 }}
                >
                  Selected Actions
                </Typography>
                {(formData.actions || []).length > 0 ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {(formData.actions || []).map((action, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{ color: "#FFFFFF" }}
                      >
                        •{" "}
                        {action
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: "#AAAAAA" }}>
                    No actions selected
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 2,
            borderTop: "1px solid #333",
            mt: "auto",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={prevStep}
            variant="outlined"
            sx={{
              visibility: currentStep === 1 ? "hidden" : "visible",
              borderColor: "#555",
              color: "#AAAAAA",
              "&:hover": {
                borderColor: "#00F3FF",
                color: "#FFFFFF",
                backgroundColor: "rgba(0, 243, 255, 0.08)",
              },
            }}
          >
            Back
          </Button>

          {isLoading ? (
            <Button
              variant="contained"
              disabled
              sx={{
                bgcolor: "#555",
                color: "#888",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span
                  className="loading-spinner"
                  style={{ marginRight: "8px" }}
                ></span>
                Creating...
              </Box>
            </Button>
          ) : (
            <Button
              endIcon={
                currentStep < STEPS.length ? <ArrowForwardIcon /> : undefined
              }
              onClick={currentStep < STEPS.length ? nextStep : handleSubmit}
              variant="contained"
              sx={{
                bgcolor: "#00F3FF",
                color: "#000",
                fontWeight: "bold",
                "&:hover": {
                  bgcolor: "rgba(0, 243, 255, 0.8)",
                },
              }}
            >
              {currentStep < STEPS.length ? "Continue" : "Create Agent"}
            </Button>
          )}
        </Box>
      </Paper>
    </Modal>
  );
}
