import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  IconButton,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Grid2,
  Stack,
  Divider,
} from '@mui/material';
import { ArrowBackOutlined, CodeOutlined, DescriptionOutlined } from '@mui/icons-material';
import Editor from '@monaco-editor/react'; 

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
            '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1 },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          '& fieldset': { borderColor: '#E2E8F0' },
          '&:hover fieldset': { borderColor: '#94A3B8' },
          '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1 },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          transition: 'all 0.2s',
        },
      },
    },
  },
});

// 자동완성용 기본 기술 스택 (원하는 대로 수정 가능)
const techStackOptions = ['React', 'Spring Boot', 'Oracle', 'Java', 'JavaScript', 'Python', 'MySQL', 'AWS', 'Docker'];
const languageOptions = ['javascript', 'java', 'python', 'sql', 'html', 'css', 'json'];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    category: '',
    title: '',
    tags: [],
    content: '', // 마크다운 텍스트 내용
    code: '',    // 소스 코드 내용
    language: 'javascript' // 에디터 기본 언어
  });

  const handleChange = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleTagsChange = (event, newValue) => {
    setForm((f) => ({ ...f, tags: newValue }));
  };

  const handleCodeChange = (value) => {
    setForm((f) => ({ ...f, code: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.title || !form.content) {
      alert('카테고리, 제목, 본문 내용은 필수입니다.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:3010/feed/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // 💡 폼 데이터 대신 JSON으로 구조화하여 마크다운, 코드, 태그를 정밀하게 전송합니다.
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/feed');
      } else {
        alert(data.message || '게시물 등록에 실패했습니다.');
      }
    } catch (error) {
      alert('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: '#F8FAFC', pt: 4, pb: 10 }}>
        <Container maxWidth="lg">
          {/* 상단 타이틀 영역 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => navigate(-1)} sx={{ mr: 1, color: '#0F172A' }}>
                <ArrowBackOutlined />
              </IconButton>
              <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
                개발 지식 작성
              </Typography>
            </Box>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              sx={{ px: 4, py: 1.2, backgroundColor: '#0F172A', '&:hover': { backgroundColor: '#2563EB' } }}
            >
              {loading ? '등록 중...' : '게시글 등록'}
            </Button>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid2 container spacing={3}>

              {/* 상단 메타데이터 입력 영역 (카테고리, 제목, 태그) */}
              <Grid2 size={{ xs: 12 }}>
                <Box sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ fontWeight: 600 }}>카테고리</InputLabel>
                        <Select
                          value={form.category}
                          label="카테고리"
                          onChange={handleChange('category')}
                          required
                        >
                          <MenuItem value="QUESTION">질문 게시판</MenuItem>
                          <MenuItem value="FREE">자유 게시판</MenuItem>
                          <MenuItem value="ERROR">로컬 에러</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="제목을 입력하세요"
                        fullWidth
                        required
                        value={form.title}
                        onChange={handleChange('title')}
                        InputLabelProps={{ sx: { fontWeight: 600 } }}
                      />
                    </Stack>

                    <Autocomplete
                      multiple
                      freeSolo
                      options={techStackOptions}
                      value={form.tags}
                      onChange={handleTagsChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            key={index}
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            sx={{ borderColor: '#2563EB', color: '#2563EB', fontWeight: 600, backgroundColor: 'rgba(37,99,235,0.05)' }}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="관련 기술 스택 태그 (Enter를 눌러 추가)"
                          placeholder="ex) React, Spring Boot"
                          InputLabelProps={{ sx: { fontWeight: 600 } }}
                        />
                      )}
                    />
                  </Stack>
                </Box>
              </Grid2>

              {/* 하단 에디터 분할 영역 (마크다운 / 코드) */}
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 0, backgroundColor: '#FFFFFF', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', height: '100%' }}>
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionOutlined sx={{ color: '#64748B', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>마크다운 본문 작성</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    minRows={18}
                    placeholder="에러가 발생한 상황이나 질문할 내용을 자유롭게 작성해주세요. (Markdown 지원)"
                    value={form.content}
                    onChange={handleChange('content')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        backgroundColor: '#FFFFFF',
                        '& fieldset': { border: 'none' },
                      }
                    }}
                  />
                </Box>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 0, backgroundColor: '#1E1E1E', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', height: '100%' }}>
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #333333', backgroundColor: '#2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CodeOutlined sx={{ color: '#94A3B8', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>소스 코드</Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={form.language}
                        onChange={handleChange('language')}
                        sx={{
                          color: '#FFFFFF',
                          backgroundColor: '#1E1E1E',
                          borderRadius: 2,
                          height: 30,
                          fontSize: '0.85rem',
                          '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #444' },
                          '& .MuiSvgIcon-root': { color: '#FFFFFF' }
                        }}
                      >
                        {languageOptions.map(lang => (
                          <MenuItem key={lang} value={lang}>{lang.toUpperCase()}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 💡 Monaco Editor 탑재 영역 */}
                  <Box sx={{ pt: 2, height: '450px' }}>
                    <Editor
                      height="100%"
                      language={form.language}
                      theme="vs-dark"
                      value={form.code}
                      onChange={handleCodeChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                      }}
                    />
                  </Box>
                </Box>
              </Grid2>

            </Grid2>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}