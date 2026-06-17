// // src/pages/MasterQues.jsx
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Upload, Download, Loader2, CheckCircle2, XCircle, AlertCircle, Languages, FileText, UploadCloud, BarChart3, ArrowRight, BookOpen } from 'lucide-react';
// import Papa from 'papaparse';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Label } from '@/components/ui/label';
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";

// const API_BASE_URL = "http://localhost:3000/api/v1/utility";
// const SUBJECT_API_URL = `${API_BASE_URL}/subject`;
// const QUESTION_API_URL = `${API_BASE_URL}/question`;

// const optionMap = { A: 0, B: 1, C: 2, D: 3 };

// // Language requirement constants
// const LANGUAGE_REQUIREMENTS = {
//   BOTH: 'both',
//   EN_ONLY: 'en_only',
//   HI_ONLY: 'hi_only',
//   EITHER: 'either'
// };

// export default function MasterQuestionUploader() {
//   const navigate = useNavigate();

//   const [selectedClass, setSelectedClass] = useState('');
//   const [languageMode, setLanguageMode] = useState(LANGUAGE_REQUIREMENTS.BOTH);
//   const [csvFile, setCsvFile] = useState(null);
//   const [parsedData, setParsedData] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadComplete, setUploadComplete] = useState(false);
//   const [errors, setErrors] = useState([]);
//   const [activeTab, setActiveTab] = useState("setup");

//   // Validation function based on language requirement
//   const validateQuestion = (question) => {
//     const errors = [];

//     switch (languageMode) {
//       case LANGUAGE_REQUIREMENTS.BOTH:
//         if (!question.questionText.en?.trim()) errors.push('English question text is required');
//         if (!question.questionText.hi?.trim()) errors.push('Hindi question text is required');
//         break;
//       case LANGUAGE_REQUIREMENTS.EN_ONLY:
//         if (!question.questionText.en?.trim()) errors.push('English question text is required');
//         break;
//       case LANGUAGE_REQUIREMENTS.HI_ONLY:
//         if (!question.questionText.hi?.trim()) errors.push('Hindi question text is required');
//         break;
//       case LANGUAGE_REQUIREMENTS.EITHER:
//         if (!question.questionText.en?.trim() && !question.questionText.hi?.trim()) {
//           errors.push('At least one language question text is required');
//         }
//         break;
//     }

//     // Validate options
//     const validOptions = question.options.filter(opt => {
//       switch (languageMode) {
//         case LANGUAGE_REQUIREMENTS.BOTH:
//           return opt.en?.trim() && opt.hi?.trim();
//         case LANGUAGE_REQUIREMENTS.EN_ONLY:
//           return opt.en?.trim();
//         case LANGUAGE_REQUIREMENTS.HI_ONLY:
//           return opt.hi?.trim();
//         case LANGUAGE_REQUIREMENTS.EITHER:
//           return opt.en?.trim() || opt.hi?.trim();
//         default:
//           return false;
//       }
//     });

//     if (validOptions.length < 2) {
//       errors.push('At least 2 valid options are required');
//     }

//     return errors;
//   };

//   // Handle CSV file selection and parsing
//   const handleCsvFileSelect = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     if (!file.name.endsWith('.csv')) {
//       alert('Please select a valid CSV file');
//       return;
//     }

//     setCsvFile(file);
//     setErrors([]);
//     setParsedData(null);
//     setUploadComplete(false);

//     Papa.parse(file, {
//       skipEmptyLines: true,
//       complete: (results) => {
//         const { data, errors: parseErrors } = results;

//         if (parseErrors.length > 0) {
//           setErrors(parseErrors.map(e => `Row ${e.row}: ${e.message}`));
//         }

//         const rawQuestions = data.slice(1);
//         const validationErrors = [];
//         const processedQuestions = [];

//         rawQuestions.forEach((row, index) => {
//           const rowNum = index + 2;

//           if (!row || row.every(cell => !cell || cell.trim() === '')) {
//             return;
//           }

//           let question;

//           // Parse based on language mode
//           if (languageMode === LANGUAGE_REQUIREMENTS.EN_ONLY) {
//             // Format: question_en, optA_en, optB_en, optC_en, optD_en, answer, difficulty, marks, explanation_en, subject, chapter
//             question = {
//               questionText: { en: row[0]?.trim() || '', hi: '' },
//               options: [
//                 { en: row[1]?.trim() || '', hi: '' },
//                 { en: row[2]?.trim() || '', hi: '' },
//                 { en: row[3]?.trim() || '', hi: '' },
//                 { en: row[4]?.trim() || '', hi: '' },
//               ],
//               correctOptionIndex: optionMap[row[5]?.trim().toUpperCase()],
//               difficulty: row[6]?.trim().toLowerCase() || 'medium',
//               marks: parseInt(row[7]) || 1,
//               explanation: { en: row[8]?.trim() || '', hi: '' },
//               subject: row[9]?.trim(),
//               chapter: row[10]?.trim()
//             };
//           } else if (languageMode === LANGUAGE_REQUIREMENTS.HI_ONLY) {
//             question = {
//               questionText: { en: '', hi: row[0]?.trim() || '' },
//               options: [
//                 { en: '', hi: row[1]?.trim() || '' },
//                 { en: '', hi: row[2]?.trim() || '' },
//                 { en: '', hi: row[3]?.trim() || '' },
//                 { en: '', hi: row[4]?.trim() || '' },
//               ],
//               correctOptionIndex: optionMap[row[5]?.trim().toUpperCase()],
//               difficulty: row[6]?.trim().toLowerCase() || 'medium',
//               marks: parseInt(row[7]) || 1,
//               explanation: { en: '', hi: row[8]?.trim() || '' },
//               subject: row[9]?.trim(),
//               chapter: row[10]?.trim()
//             };
//           } else {
//             question = {
//               questionText: {
//                 en: row[5]?.trim() || '',
//                 hi: row[0]?.trim() || ''
//               },
//               options: [
//                 { en: row[6]?.trim() || '', hi: row[1]?.trim() || '' },
//                 { en: row[7]?.trim() || '', hi: row[2]?.trim() || '' },
//                 { en: row[8]?.trim() || '', hi: row[3]?.trim() || '' },
//                 { en: row[9]?.trim() || '', hi: row[4]?.trim() || '' },
//               ],
//               correctOptionIndex: optionMap[row[10]?.trim().toUpperCase()],
//               difficulty: row[11]?.trim().toLowerCase() || 'medium',
//               marks: parseInt(row[12]) || 1,
//               explanation: {
//                 en: row[13]?.trim() || '',
//                 hi: row[14]?.trim() || ''
//               },
//               subject: row[15]?.trim(),
//               chapter: row[16]?.trim()
//             };
//           }

//           // Validate required fields
//           if (!question.subject || !question.chapter) {
//             validationErrors.push(`Row ${rowNum}: Missing subject or chapter`);
//             return;
//           }

//           if (question.correctOptionIndex === undefined) {
//             // Fallback for case where answer might be 0,1,2,3 instead of A,B,C,D
//             const intAns = parseInt(row[languageMode === 'both' ? 10 : 5]);
//             if (!isNaN(intAns) && intAns >= 0 && intAns <= 3) {
//               question.correctOptionIndex = intAns;
//             } else {
//               validationErrors.push(`Row ${rowNum}: Invalid answer. Must be A, B, C, or D`);
//               return;
//             }
//           }

//           // Validate difficulty
//           if (question.difficulty && !['easy', 'medium', 'hard'].includes(question.difficulty)) {
//             validationErrors.push(`Row ${rowNum}: Invalid difficulty '${question.difficulty}'. Must be easy, medium, or hard`);
//             return;
//           }

//           // Validate marks
//           if (isNaN(question.marks) || question.marks < 1) {
//             question.marks = 1; // Default to 1 if invalid
//           }

//           // Validate based on language mode
//           const questionErrors = validateQuestion(question);
//           if (questionErrors.length > 0) {
//             validationErrors.push(`Row ${rowNum}: ${questionErrors.join(', ')}`);
//             return;
//           }

//           // Filter options based on language mode
//           question.options = question.options.filter(opt => {
//             switch (languageMode) {
//               case LANGUAGE_REQUIREMENTS.BOTH:
//                 return opt.en?.trim() && opt.hi?.trim();
//               case LANGUAGE_REQUIREMENTS.EN_ONLY:
//                 return opt.en?.trim();
//               case LANGUAGE_REQUIREMENTS.HI_ONLY:
//                 return opt.hi?.trim();
//               case LANGUAGE_REQUIREMENTS.EITHER:
//                 return opt.en?.trim() || opt.hi?.trim();
//               default:
//                 return false;
//             }
//           });

//           if (question.options.length < 2) {
//             validationErrors.push(`Row ${rowNum}: Must have at least 2 valid options after filtering`);
//             return;
//           }

//           processedQuestions.push(question);
//         });

//         if (validationErrors.length > 0) {
//           setErrors(prev => [...prev, ...validationErrors]);
//         }

//         const grouped = groupQuestionsBySubjectAndChapter(processedQuestions);
//         setParsedData(grouped);
//         if (validationErrors.length === 0) {
//           setActiveTab("preview");
//         }
//       },
//       error: (error) => {
//         setErrors([`Parse error: ${error.message}`]);
//       }
//     });
//   };

//   // Group questions by subject and chapter
//   const groupQuestionsBySubjectAndChapter = (questions) => {
//     const grouped = {};

//     questions.forEach(question => {
//       const subject = question.subject;
//       const chapter = question.chapter;

//       if (!grouped[subject]) {
//         grouped[subject] = {};
//       }

//       if (!grouped[subject][chapter]) {
//         grouped[subject][chapter] = [];
//       }

//       const { subject: _, chapter: __, ...questionData } = question;
//       grouped[subject][chapter].push(questionData);
//     });

//     return grouped;
//   };


//   const uploadQuestionsForChapter = async (subjectName, chapterName, questions, progressIndex) => {
//     try {
//       console.log(`Starting upload for ${subjectName} / ${chapterName} with ${questions.length} questions`);

//       // 1. Find or create subject
//       const subjectsRes = await fetch(`${SUBJECT_API_URL}/class/${selectedClass}`);

//       if (!subjectsRes.ok) {
//         throw new Error(`Failed to fetch subjects: ${subjectsRes.statusText}`);
//       }

//       const subjects = await subjectsRes.json();
//       let subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());

//       if (!subject) {
//         console.log(`Creating subject: ${subjectName}`);
//         const createSubjectRes = await fetch(`${SUBJECT_API_URL}`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             name: subjectName,
//             studentClass: parseInt(selectedClass),
//             languageRequirement: languageMode
//           })
//         });

//         if (!createSubjectRes.ok) {
//           const errorText = await createSubjectRes.text();
//           throw new Error(`Failed to create subject: ${errorText}`);
//         }

//         subject = await createSubjectRes.json();
//         console.log('Subject created:', subject);
//       } else if (subject.languageRequirement !== languageMode) {
//         console.log(`Updating language requirement for subject: ${subjectName}`);
//         const updateRes = await fetch(`${SUBJECT_API_URL}/${subject._id}/language-requirement`, {
//           method: 'PATCH',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ languageRequirement: languageMode })
//         });

//         if (!updateRes.ok) {
//           console.warn('Failed to update language requirement, continuing with existing setting');
//         } else {
//           subject = await updateRes.json();
//         }
//       }

//       // 2. Find or create chapter
//       const chaptersRes = await fetch(`${SUBJECT_API_URL}/${subject._id}/chapters`);

//       if (!chaptersRes.ok) {
//         throw new Error(`Failed to fetch chapters: ${chaptersRes.statusText}`);
//       }

//       const chapters = await chaptersRes.json();
//       let chapter = chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());

//       if (!chapter) {
//         console.log(`Creating chapter: ${chapterName}`);

//         // Calculate next order number
//         const maxOrder = chapters.length > 0
//           ? Math.max(...chapters.map(c => c.order || 0))
//           : 0;

//         const createChapterRes = await fetch(`${SUBJECT_API_URL}/${subject._id}/chapters`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             name: chapterName,
//             studentClass: parseInt(selectedClass),
//             order: maxOrder + 1
//           })
//         });

//         if (!createChapterRes.ok) {
//           const errorText = await createChapterRes.text();
//           throw new Error(`Failed to create chapter: ${errorText}`);
//         }

//         chapter = await createChapterRes.json();
//         console.log('Chapter created:', chapter);
//       }

//       // Validate we have valid IDs
//       if (!subject._id || !chapter._id) {
//         throw new Error('Invalid subject or chapter ID');
//       }

//       // 3. Upload questions in chunks
//       const CHUNK_SIZE = 50;
//       const chunks = [];

//       for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
//         chunks.push(questions.slice(i, i + CHUNK_SIZE));
//       }

//       let uploadedCount = 0;

//       for (let i = 0; i < chunks.length; i++) {
//         const chunk = chunks[i];

//         console.log(`Uploading chunk ${i + 1}/${chunks.length} (${chunk.length} questions)`);

//         // Update progress with chunk info
//         setUploadProgress(prev => {
//           const newProgress = [...prev];
//           if (newProgress[progressIndex]) {
//             newProgress[progressIndex].currentChunk = i + 1;
//             newProgress[progressIndex].totalChunks = chunks.length;
//             newProgress[progressIndex].uploadedCount = uploadedCount;
//           }
//           return newProgress;
//         });

//         const uploadRes = await fetch(`${QUESTION_API_URL}/bulkpost`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             subjectId: subject._id,
//             chapterId: chapter._id,
//             questions: chunk
//           })
//         });

//         if (!uploadRes.ok) {
//           const errorText = await uploadRes.text();
//           throw new Error(`Failed to upload chunk ${i + 1}: ${uploadRes.status} ${errorText}`);
//         }

//         const result = await uploadRes.json();
//         console.log(`Chunk ${i + 1} uploaded:`, result.message);

//         uploadedCount += chunk.length;

//         // Small delay between chunks
//         if (i < chunks.length - 1) {
//           await new Promise(resolve => setTimeout(resolve, 200));
//         }
//       }

//       console.log(`Successfully uploaded ${uploadedCount} questions for ${subjectName} / ${chapterName}`);

//       return {
//         success: true,
//         subject: subjectName,
//         chapter: chapterName,
//         count: uploadedCount
//       };
//     } catch (error) {
//       console.error('Upload error:', error);
//       return {
//         success: false,
//         subject: subjectName,
//         chapter: chapterName,
//         error: error.message
//       };
//     }
//   };



//   // Handle master upload
//   const handleMasterUpload = async () => {
//     if (!selectedClass) {
//       alert('Please select a class');
//       return;
//     }

//     if (!parsedData) {
//       alert('Please upload and parse a CSV file first');
//       return;
//     }

//     setActiveTab("upload");
//     setIsUploading(true);
//     setUploadProgress([]);
//     setUploadComplete(false);

//     const progressTracker = [];
//     let progressIndex = 0;

//     // Initialize progress tracker
//     for (const subjectName of Object.keys(parsedData)) {
//       for (const chapterName of Object.keys(parsedData[subjectName])) {
//         const questions = parsedData[subjectName][chapterName];
//         progressTracker.push({
//           subject: subjectName,
//           chapter: chapterName,
//           totalQuestions: questions.length,
//           uploadedCount: 0,
//           status: 'pending' // pending, uploading, success, error
//         });
//       }
//     }
//     setUploadProgress([...progressTracker]);

//     // Process each
//     for (const subjectName of Object.keys(parsedData)) {
//       for (const chapterName of Object.keys(parsedData[subjectName])) {
//         const questions = parsedData[subjectName][chapterName];

//         setUploadProgress(prev => {
//           const np = [...prev];
//           np[progressIndex].status = 'uploading';
//           return np;
//         });

//         const result = await uploadQuestionsForChapter(subjectName, chapterName, questions, progressIndex);

//         setUploadProgress(prev => {
//           const np = [...prev];
//           if (result.success) {
//             np[progressIndex].status = 'success';
//             np[progressIndex].uploadedCount = questions.length;
//           } else {
//             np[progressIndex].status = 'error';
//             np[progressIndex].error = result.error;
//           }
//           return np;
//         });

//         progressIndex++;
//       }
//     }

//     setIsUploading(false);
//     setUploadComplete(true);
//   };

//   // Download CSV template
//   const handleDownloadTemplate = () => {
//     let csvData;

//     switch (languageMode) {
//       case LANGUAGE_REQUIREMENTS.EN_ONLY:
//         csvData = [
//           ['question_en', 'optA_en', 'optB_en', 'optC_en', 'optD_en', 'answer', 'difficulty', 'marks', 'explanation_en', 'subject', 'chapter'],
//           ['What is the capital of India?', 'Mumbai', 'New Delhi', 'Kolkata', 'Chennai', 'B', 'easy', '1', 'New Delhi is the official capital of India.', 'Social Science', 'Indian Geography'],
//           ['What is 2 + 2?', '3', '4', '5', '6', 'B', 'easy', '1', 'Basic addition: 2 plus 2 equals 4.', 'Mathematics', 'Basic Arithmetic']
//         ];
//         break;

//       case LANGUAGE_REQUIREMENTS.HI_ONLY:
//         csvData = [
//           ['question_hi', 'optA_hi', 'optB_hi', 'optC_hi', 'optD_hi', 'answer', 'difficulty', 'marks', 'explanation_hi', 'subject', 'chapter'],
//           ['भारत की राजधानी क्या है?', 'मुंबई', 'नई दिल्ली', 'कोलकाता', 'चेन्नई', 'B', 'easy', '1', 'नई दिल्ली भारत की आधिकारिक राजधानी है।', 'सामाजिक विज्ञान', 'भारतीय भूगोल'],
//           ['2 + 2 = ?', '3', '4', '5', '6', 'B', 'easy', '1', 'बुनियादी जोड़: 2 जमा 2 बराबर 4।', 'गणित', 'बुनियादी अंकगणित']
//         ];
//         break;

//       default:
//         csvData = [
//           ['question_hi', 'optA_hi', 'optB_hi', 'optC_hi', 'optD_hi', 'question_en', 'optA_en', 'optB_en', 'optC_en', 'optD_en', 'answer', 'difficulty', 'marks', 'explanation_en', 'explanation_hi', 'subject', 'chapter'],
//           ['भारत की राजधानी क्या है?', 'मुंबई', 'नई दिल्ली', 'कोलकाता', 'चेन्नई', 'What is the capital of India?', 'Mumbai', 'New Delhi', 'Kolkata', 'Chennai', 'B', 'easy', '1', 'New Delhi is the official capital of India.', 'नई दिल्ली भारत की आधिकारिक राजधानी है।', 'Social Science', 'Indian Geography'],
//           ['2 + 2 = ?', '3', '4', '5', '6', 'What is 2 + 2?', '3', '4', '5', '6', 'B', 'medium', '2', 'Basic addition: 2 plus 2 equals 4.', 'बुनियादी जोड़: 2 जमा 2 बराबर 4।', 'Mathematics', 'Basic Arithmetic']
//         ];
//     }

//     const csv = Papa.unparse(csvData);
//     const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = `master_questions_template_${languageMode}.csv`;
//     link.click();
//   };

//   // Calculate statistics
//   const getStatistics = () => {
//     if (!parsedData) return { subjects: 0, chapters: 0, questions: 0, totalMarks: 0 };

//     let totalQuestions = 0;
//     let totalChapters = 0;
//     let totalMarks = 0;
//     const subjects = Object.keys(parsedData).length;

//     Object.values(parsedData).forEach(subject => {
//       totalChapters += Object.keys(subject).length;
//       Object.values(subject).forEach(questions => {
//         totalQuestions += questions.length;
//         questions.forEach(q => {
//           totalMarks += q.marks || 1;
//         });
//       });
//     });

//     return { subjects, chapters: totalChapters, questions: totalQuestions, totalMarks };
//   };

//   // Get language label
//   const getLanguageLabel = () => {
//     switch (languageMode) {
//       case LANGUAGE_REQUIREMENTS.BOTH:
//         return { text: "Both EN & HI Required", color: "bg-blue-600" };
//       case LANGUAGE_REQUIREMENTS.EN_ONLY:
//         return { text: "English Only", color: "bg-green-600" };
//       case LANGUAGE_REQUIREMENTS.HI_ONLY:
//         return { text: "Hindi Only", color: "bg-orange-600" };
//       case LANGUAGE_REQUIREMENTS.EITHER:
//         return { text: "Either EN or HI", color: "bg-purple-600" };
//       default:
//         return { text: "Both Languages", color: "bg-blue-600" };
//     }
//   };

//   const stats = getStatistics();
//   const langLabel = getLanguageLabel();

//   return (
//     <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-7xl mx-auto p-4 md:p-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div className="space-y-1">
//           <h1 className="text-3xl font-bold tracking-tight">Master Uploader</h1>
//           <p className="text-muted-foreground">Bulk upload questions across subjects and chapters instantly.</p>
//         </div>
//         <Badge className={`${langLabel.color} text-white px-3 py-1 text-sm shadow-md`}>
//           <Languages className="mr-2 h-4 w-4" />
//           {langLabel.text}
//         </Badge>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Left Sidebar - Steps */}
//         <div className="lg:col-span-1 space-y-6">
//           <Card className={`border-l-4 ${activeTab === 'setup' ? 'border-l-primary shadow-md' : 'border-l-transparent text-muted-foreground opacity-70'}`}>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${activeTab === 'setup' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
//                 Setup & Config
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="text-sm">
//               Select class and language requirements.
//             </CardContent>
//           </Card>

//           <Card className={`border-l-4 ${activeTab === 'preview' ? 'border-l-primary shadow-md' : 'border-l-transparent text-muted-foreground opacity-70'}`}>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${activeTab === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
//                 Preview Data
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="text-sm">
//               Review parsed questions and statistics.
//             </CardContent>
//           </Card>

//           <Card className={`border-l-4 ${activeTab === 'upload' ? 'border-l-primary shadow-md' : 'border-l-transparent text-muted-foreground opacity-70'}`}>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${activeTab === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
//                 Upload Progress
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="text-sm">
//               Track upload status for each chapter.
//             </CardContent>
//           </Card>
//         </div>

//         {/* Main Content Area */}
//         <div className="lg:col-span-3">
//           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//             <TabsContent value="setup" className="mt-0 space-y-6">
//               {/* Step 1: Class Selection */}
//               <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
//                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
//                 <CardHeader>
//                   <CardTitle>Configuration</CardTitle>
//                   <CardDescription>Configure the upload settings before selecting your file.</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <Label htmlFor="class-select">Select Class</Label>
//                       <Select value={selectedClass} onValueChange={setSelectedClass}>
//                         <SelectTrigger id="class-select" className="w-full bg-background h-11">
//                           <SelectValue placeholder="Choose a class..." />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {[6, 7, 8, 9, 10, 11, 12].map(cls => (
//                             <SelectItem key={cls} value={cls.toString()}>Class {cls}</SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="space-y-3">
//                       <Label>Language Mode</Label>
//                       <div className="grid grid-cols-2 gap-3">
//                         {[
//                           { id: LANGUAGE_REQUIREMENTS.BOTH, label: 'Bilingual', sub: 'English + Hindi' },
//                           { id: LANGUAGE_REQUIREMENTS.EN_ONLY, label: 'English', sub: 'English Only' },
//                           { id: LANGUAGE_REQUIREMENTS.HI_ONLY, label: 'Hindi', sub: 'Hindi Only' },
//                           { id: LANGUAGE_REQUIREMENTS.EITHER, label: 'Flexible', sub: 'Either Language' },
//                         ].map((item) => (
//                           <div key={item.id}
//                             className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900 ${languageMode === item.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
//                             onClick={() => setLanguageMode(item.id)}
//                           >
//                             <span className="font-semibold text-sm">{item.label}</span>
//                             <span className="text-xs text-muted-foreground">{item.sub}</span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Step 2: File Upload */}
//               <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
//                 <CardHeader>
//                   <CardTitle>File Upload</CardTitle>
//                   <CardDescription>Upload your CSV file with the standard template.</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50 group hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors relative">
//                     <Input type="file" accept=".csv" onChange={handleCsvFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={!selectedClass} />
//                     <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
//                       <UploadCloud className="h-8 w-8" />
//                     </div>
//                     <h3 className="text-lg font-semibold mb-1">
//                       {csvFile ? csvFile.name : "Click to upload or drag and drop"}
//                     </h3>
//                     <p className="text-sm text-muted-foreground max-w-xs mx-auto">
//                       {csvFile ? "File selected. Ready to parse." : "CSV files only. Please ensure formatting matches the template."}
//                     </p>
//                     {!selectedClass && <p className="text-xs text-red-500 mt-2 font-medium">Please select a class first</p>}
//                   </div>

//                   <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
//                     <div className="flex items-center gap-3">
//                       <div className="bg-green-100 text-green-700 p-2 rounded-md">
//                         <FileText className="h-5 w-5" />
//                       </div>
//                       <div>
//                         <p className="font-medium text-sm">Need the template?</p>
//                         <p className="text-xs text-muted-foreground">Download the latest CSV format.</p>
//                       </div>
//                     </div>
//                     <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={!selectedClass}>
//                       <Download className="mr-2 h-3.5 w-3.5" /> Download CSV
//                     </Button>
//                   </div>

//                   {errors.length > 0 && (
//                     <Alert variant="destructive">
//                       <AlertCircle className="h-4 w-4" />
//                       <AlertTitle>Validation Errors</AlertTitle>
//                       <AlertDescription className="mt-2 text-xs">
//                         <ul className="list-disc pl-4 space-y-1">
//                           {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
//                         </ul>
//                         {errors.length > 5 && <p className="mt-1 font-medium">...and {errors.length - 5} more errors.</p>}
//                       </AlertDescription>
//                     </Alert>
//                   )}
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="preview" className="mt-0 space-y-6">
//               {parsedData && (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                     <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
//                       <CardContent className="p-4 flex flex-col items-center justify-center text-center">
//                         <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.questions}</span>
//                         <span className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mt-1">Questions</span>
//                       </CardContent>
//                     </Card>
//                     <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
//                       <CardContent className="p-4 flex flex-col items-center justify-center text-center">
//                         <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.subjects}</span>
//                         <span className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70 uppercase tracking-widest mt-1">Subjects</span>
//                       </CardContent>
//                     </Card>
//                     <Card className="bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800">
//                       <CardContent className="p-4 flex flex-col items-center justify-center text-center">
//                         <span className="text-4xl font-bold text-pink-600 dark:text-pink-400">{stats.chapters}</span>
//                         <span className="text-xs font-medium text-pink-600/70 dark:text-pink-400/70 uppercase tracking-widest mt-1">Chapters</span>
//                       </CardContent>
//                     </Card>
//                     <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
//                       <CardContent className="p-4 flex flex-col items-center justify-center text-center">
//                         <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">{stats.totalMarks}</span>
//                         <span className="text-xs font-medium text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest mt-1">Total Marks</span>
//                       </CardContent>
//                     </Card>
//                   </div>

//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <h3 className="text-lg font-semibold">Parsed Content Breakdown</h3>
//                       <Button size="lg" onClick={handleMasterUpload} className="shadow-lg hover:shadow-xl transition-shadow bg-green-600 hover:bg-green-700 text-white">
//                         Start Upload <ArrowRight className="ml-2 h-4 w-4" />
//                       </Button>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                       {Object.keys(parsedData).map((subject) => (
//                         <Card key={subject} className="overflow-hidden border-slate-200 dark:border-slate-800">
//                           <CardHeader className="bg-slate-100 dark:bg-slate-800 py-3 px-4 border-b">
//                             <CardTitle className="text-sm font-bold flex items-center justify-between">
//                               {subject}
//                               <Badge variant="outline" className="bg-white dark:bg-slate-950">{Object.keys(parsedData[subject]).length} Chapters</Badge>
//                             </CardTitle>
//                           </CardHeader>
//                           <CardContent className="p-0">
//                             <ScrollArea className="h-[200px]">
//                               <div className="divide-y">
//                                 {Object.keys(parsedData[subject]).map((chapter) => (
//                                   <div key={chapter} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
//                                     <div className="flex items-center gap-2">
//                                       <BookOpen className="h-4 w-4 text-muted-foreground" />
//                                       <span className="text-sm font-medium line-clamp-1 max-w-[150px]" title={chapter}>{chapter}</span>
//                                     </div>
//                                     <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
//                                       {parsedData[subject][chapter].length} Qs
//                                     </span>
//                                   </div>
//                                 ))}
//                               </div>
//                             </ScrollArea>
//                           </CardContent>
//                         </Card>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             <TabsContent value="upload" className="mt-0 space-y-6">
//               <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
//                 <div className="space-y-1">
//                   <h3 className="font-semibold text-lg">Upload Status</h3>
//                   <p className="text-sm text-muted-foreground">
//                     {uploadComplete ? "All uploads completed!" : "Uploading questions to the database..."}
//                   </p>
//                 </div>
//                 {uploadComplete && (
//                   <Button onClick={() => { setParsedData(null); setActiveTab("setup"); setCsvFile(null); }} variant="outline">
//                     Upload Another File
//                   </Button>
//                 )}
//               </div>

//               <ScrollArea className="h-[500px] pr-4">
//                 <div className="space-y-3">
//                   {uploadProgress.map((item, index) => (
//                     <Card key={index} className={`overflow-hidden transition-all ${item.status === 'uploading' ? 'border-primary shadow-md ring-1 ring-primary/20 transform scale-[1.01]' : 'border-slate-200 dark:border-slate-800'}`}>
//                       <div className="p-4 flex items-center gap-4">
//                         <div className="flex-shrink-0">
//                           {item.status === 'pending' && <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><Loader2 className="h-5 w-5" /></div>}
//                           {item.status === 'uploading' && <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Loader2 className="h-5 w-5 animate-spin" /></div>}
//                           {item.status === 'success' && <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 className="h-6 w-6" /></div>}
//                           {item.status === 'error' && <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><XCircle className="h-6 w-6" /></div>}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex justify-between mb-1">
//                             <h4 className="font-semibold truncate">{item.chapter}</h4>
//                             <span className="text-xs text-muted-foreground">{item.subject}</span>
//                           </div>
//                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                             {item.status === 'uploading' ? (
//                               <span>Uploading... {item.uploadedCount}/{item.totalQuestions}</span>
//                             ) : item.status === 'success' ? (
//                               <span className="text-green-600 font-medium">Completed ({item.totalQuestions} Questions)</span>
//                             ) : item.status === 'error' ? (
//                               <span className="text-red-600 font-medium">Failed: {item.error}</span>
//                             ) : (
//                               <span>Waiting...</span>
//                             )}
//                           </div>
//                           {item.status === 'uploading' && (
//                             <Progress value={(item.uploadedCount / item.totalQuestions) * 100} className="h-1.5 mt-2" />
//                           )}
//                         </div>
//                       </div>
//                     </Card>
//                   ))}
//                 </div>
//               </ScrollArea>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack
} from '@mui/material';
import {
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Languages,
  FileText,
  UploadCloud,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Papa from 'papaparse';


const optionMap = { A: 0, B: 1, C: 2, D: 3 };


const LANGUAGE_REQUIREMENTS = {
  BOTH: 'both',
  EN_ONLY: 'en_only',
  HI_ONLY: 'hi_only',
  EITHER: 'either'
};


function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}


export default function MasterQuestionUploader() {
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:3000/api/v1/utility";
  const SUBJECT_API_URL = `${API_BASE_URL}/subject`;
  const QUESTION_API_URL = `${API_BASE_URL}/question`;


  const [selectedClass, setSelectedClass] = useState('');
  const [languageMode, setLanguageMode] = useState(LANGUAGE_REQUIREMENTS.BOTH);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errors, setErrors] = useState([]);
  const [activeTab, setActiveTab] = useState(0);


  // GET AUTH TOKEN FROM LOCALSTORAGE
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };


  // Validation function
  const validateQuestion = (question) => {
    const errors = [];

    switch (languageMode) {
      case LANGUAGE_REQUIREMENTS.BOTH:
        if (!question.questionText.en?.trim()) errors.push('English question text is required');
        if (!question.questionText.hi?.trim()) errors.push('Hindi question text is required');
        break;
      case LANGUAGE_REQUIREMENTS.EN_ONLY:
        if (!question.questionText.en?.trim()) errors.push('English question text is required');
        break;
      case LANGUAGE_REQUIREMENTS.HI_ONLY:
        if (!question.questionText.hi?.trim()) errors.push('Hindi question text is required');
        break;
      case LANGUAGE_REQUIREMENTS.EITHER:
        if (!question.questionText.en?.trim() && !question.questionText.hi?.trim()) {
          errors.push('At least one language question text is required');
        }
        break;
    }

    const validOptions = question.options.filter(opt => {
      switch (languageMode) {
        case LANGUAGE_REQUIREMENTS.BOTH:
          return opt.en?.trim() && opt.hi?.trim();
        case LANGUAGE_REQUIREMENTS.EN_ONLY:
          return opt.en?.trim();
        case LANGUAGE_REQUIREMENTS.HI_ONLY:
          return opt.hi?.trim();
        case LANGUAGE_REQUIREMENTS.EITHER:
          return opt.en?.trim() || opt.hi?.trim();
        default:
          return false;
      }
    });

    if (validOptions.length < 2) {
      errors.push('At least 2 valid options are required');
    }

    return errors;
  };


  // Handle CSV file selection
  const handleCsvFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }

    setCsvFile(file);
    setErrors([]);
    setParsedData(null);
    setUploadComplete(false);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const { data, errors: parseErrors } = results;

        if (parseErrors.length > 0) {
          setErrors(parseErrors.map(e => `Row ${e.row}: ${e.message}`));
        }

        const rawQuestions = data.slice(1);
        const validationErrors = [];
        const processedQuestions = [];

        rawQuestions.forEach((row, index) => {
          const rowNum = index + 2;

          if (!row || row.every(cell => !cell || cell.trim() === '')) {
            return;
          }

          let question;

          if (languageMode === LANGUAGE_REQUIREMENTS.EN_ONLY) {
            question = {
              questionText: { en: row[0]?.trim() || '', hi: '' },
              options: [
                { en: row[1]?.trim() || '', hi: '' },
                { en: row[2]?.trim() || '', hi: '' },
                { en: row[3]?.trim() || '', hi: '' },
                { en: row[4]?.trim() || '', hi: '' },
              ],
              correctOptionIndex: optionMap[row[5]?.trim().toUpperCase()],
              difficulty: row[6]?.trim().toLowerCase() || 'medium',
              marks: parseInt(row[7]) || 1,
              explanation: { en: row[8]?.trim() || '', hi: '' },
              subject: row[9]?.trim(),
              chapter: row[10]?.trim()
            };
          } else if (languageMode === LANGUAGE_REQUIREMENTS.HI_ONLY) {
            question = {
              questionText: { en: '', hi: row[0]?.trim() || '' },
              options: [
                { en: '', hi: row[1]?.trim() || '' },
                { en: '', hi: row[2]?.trim() || '' },
                { en: '', hi: row[3]?.trim() || '' },
                { en: '', hi: row[4]?.trim() || '' },
              ],
              correctOptionIndex: optionMap[row[5]?.trim().toUpperCase()],
              difficulty: row[6]?.trim().toLowerCase() || 'medium',
              marks: parseInt(row[7]) || 1,
              explanation: { en: '', hi: row[8]?.trim() || '' },
              subject: row[9]?.trim(),
              chapter: row[10]?.trim()
            };
          } else {
            question = {
              questionText: {
                en: row[5]?.trim() || '',
                hi: row[0]?.trim() || ''
              },
              options: [
                { en: row[6]?.trim() || '', hi: row[1]?.trim() || '' },
                { en: row[7]?.trim() || '', hi: row[2]?.trim() || '' },
                { en: row[8]?.trim() || '', hi: row[3]?.trim() || '' },
                { en: row[9]?.trim() || '', hi: row[4]?.trim() || '' },
              ],
              correctOptionIndex: optionMap[row[10]?.trim().toUpperCase()],
              difficulty: row[11]?.trim().toLowerCase() || 'medium',
              marks: parseInt(row[12]) || 1,
              explanation: {
                en: row[13]?.trim() || '',
                hi: row[14]?.trim() || ''
              },
              subject: row[15]?.trim(),
              chapter: row[16]?.trim()
            };
          }

          if (!question.subject || !question.chapter) {
            validationErrors.push(`Row ${rowNum}: Missing subject or chapter`);
            return;
          }

          if (question.correctOptionIndex === undefined) {
            const intAns = parseInt(row[languageMode === 'both' ? 10 : 5]);
            if (!isNaN(intAns) && intAns >= 0 && intAns <= 3) {
              question.correctOptionIndex = intAns;
            } else {
              validationErrors.push(`Row ${rowNum}: Invalid answer`);
              return;
            }
          }

          const questionErrors = validateQuestion(question);
          if (questionErrors.length > 0) {
            validationErrors.push(`Row ${rowNum}: ${questionErrors.join(', ')}`);
            return;
          }

          question.options = question.options.filter(opt => {
            switch (languageMode) {
              case LANGUAGE_REQUIREMENTS.BOTH:
                return opt.en?.trim() && opt.hi?.trim();
              case LANGUAGE_REQUIREMENTS.EN_ONLY:
                return opt.en?.trim();
              case LANGUAGE_REQUIREMENTS.HI_ONLY:
                return opt.hi?.trim();
              case LANGUAGE_REQUIREMENTS.EITHER:
                return opt.en?.trim() || opt.hi?.trim();
              default:
                return false;
            }
          });

          processedQuestions.push(question);
        });

        if (validationErrors.length > 0) {
          setErrors(prev => [...prev, ...validationErrors]);
        }

        const grouped = groupQuestionsBySubjectAndChapter(processedQuestions);
        setParsedData(grouped);
        if (validationErrors.length === 0) {
          setActiveTab(1);
        }
      },
      error: (error) => {
        setErrors([`Parse error: ${error.message}`]);
      }
    });
  };


  const groupQuestionsBySubjectAndChapter = (questions) => {
    const grouped = {};
    questions.forEach(question => {
      const subject = question.subject;
      const chapter = question.chapter;

      if (!grouped[subject]) grouped[subject] = {};
      if (!grouped[subject][chapter]) grouped[subject][chapter] = [];

      const { subject: _, chapter: __, ...questionData } = question;
      grouped[subject][chapter].push(questionData);
    });
    return grouped;
  };


  const uploadQuestionsForChapter = async (subjectName, chapterName, questions, progressIndex) => {
    try {
      const subjectsRes = await fetch(`${SUBJECT_API_URL}/class/${selectedClass}`, {
        headers: getAuthHeaders()
      });
      
      if (!subjectsRes.ok) {
        if (subjectsRes.status === 401) {
          throw new Error('Unauthorized: Please login again');
        }
        throw new Error('Failed to fetch subjects');
      }

      const subjects = await subjectsRes.json();
      let subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());

      if (!subject) {
        const createSubjectRes = await fetch(`${SUBJECT_API_URL}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: subjectName,
            studentClass: parseInt(selectedClass),
            languageRequirement: languageMode
          })
        });
        if (!createSubjectRes.ok) throw new Error('Failed to create subject');
        subject = await createSubjectRes.json();
      }

      const chaptersRes = await fetch(`${SUBJECT_API_URL}/${subject._id}/chapters`, {
        headers: getAuthHeaders()
      });
      if (!chaptersRes.ok) throw new Error('Failed to fetch chapters');

      const chapters = await chaptersRes.json();
      let chapter = chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());

      if (!chapter) {
        const maxOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order || 0)) : 0;
        const createChapterRes = await fetch(`${SUBJECT_API_URL}/${subject._id}/chapters`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: chapterName,
            studentClass: parseInt(selectedClass),
            order: maxOrder + 1
          })
        });
        if (!createChapterRes.ok) throw new Error('Failed to create chapter');
        chapter = await createChapterRes.json();
      }

      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
        chunks.push(questions.slice(i, i + CHUNK_SIZE));
      }

      let uploadedCount = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        setUploadProgress(prev => {
          const newProgress = [...prev];
          if (newProgress[progressIndex]) {
            newProgress[progressIndex].uploadedCount = uploadedCount;
          }
          return newProgress;
        });

        const uploadRes = await fetch(`${QUESTION_API_URL}/bulkpost`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            subjectId: subject._id,
            chapterId: chapter._id,
            questions: chunk
          })
        });

        if (!uploadRes.ok) throw new Error(`Failed to upload chunk ${i + 1}`);
        uploadedCount += chunk.length;

        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      return { success: true, subject: subjectName, chapter: chapterName, count: uploadedCount };
    } catch (error) {
      return { success: false, subject: subjectName, chapter: chapterName, error: error.message };
    }
  };


  const handleMasterUpload = async () => {
    if (!selectedClass || !parsedData) {
      alert('Please complete setup first');
      return;
    }

    setActiveTab(2);
    setIsUploading(true);
    setUploadProgress([]);
    setUploadComplete(false);

    const progressTracker = [];
    for (const subjectName of Object.keys(parsedData)) {
      for (const chapterName of Object.keys(parsedData[subjectName])) {
        const questions = parsedData[subjectName][chapterName];
        progressTracker.push({
          subject: subjectName,
          chapter: chapterName,
          totalQuestions: questions.length,
          uploadedCount: 0,
          status: 'pending'
        });
      }
    }
    setUploadProgress([...progressTracker]);

    let progressIndex = 0;
    for (const subjectName of Object.keys(parsedData)) {
      for (const chapterName of Object.keys(parsedData[subjectName])) {
        const questions = parsedData[subjectName][chapterName];

        setUploadProgress(prev => {
          const np = [...prev];
          if (np[progressIndex]) {
            np[progressIndex].status = 'uploading';
          }
          return np;
        });

        const result = await uploadQuestionsForChapter(subjectName, chapterName, questions, progressIndex);

        setUploadProgress(prev => {
          const np = [...prev];
          if (np[progressIndex]) {
            if (result.success) {
              np[progressIndex].status = 'success';
              np[progressIndex].uploadedCount = questions.length;
            } else {
              np[progressIndex].status = 'error';
              np[progressIndex].error = result.error;
            }
          }
          return np;
        });

        progressIndex++;
      }
    }

    setIsUploading(false);
    setUploadComplete(true);
  };


  const handleDownloadTemplate = () => {
    let csvData;

    switch (languageMode) {
      case LANGUAGE_REQUIREMENTS.EN_ONLY:
        csvData = [
          ['question_en', 'optA_en', 'optB_en', 'optC_en', 'optD_en', 'answer', 'difficulty', 'marks', 'explanation_en', 'subject', 'chapter'],
          ['What is 2 + 2?', '3', '4', '5', '6', 'B', 'easy', '1', 'Basic addition', 'Mathematics', 'Arithmetic']
        ];
        break;
      case LANGUAGE_REQUIREMENTS.HI_ONLY:
        csvData = [
          ['question_hi', 'optA_hi', 'optB_hi', 'optC_hi', 'optD_hi', 'answer', 'difficulty', 'marks', 'explanation_hi', 'subject', 'chapter'],
          ['2 + 2 = ?', '3', '4', '5', '6', 'B', 'easy', '1', 'बुनियादी जोड़', 'गणित', 'अंकगणित']
        ];
        break;
      default:
        csvData = [
          ['question_hi', 'optA_hi', 'optB_hi', 'optC_hi', 'optD_hi', 'question_en', 'optA_en', 'optB_en', 'optC_en', 'optD_en', 'answer', 'difficulty', 'marks', 'explanation_en', 'explanation_hi', 'subject', 'chapter'],
          ['2 + 2 = ?', '3', '4', '5', '6', 'What is 2 + 2?', '3', '4', '5', '6', 'B', 'easy', '1', 'Basic addition', 'बुनियादी जोड़', 'Mathematics', 'Arithmetic']
        ];
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `master_template_${languageMode}.csv`;
    link.click();
  };


  const getStatistics = () => {
    if (!parsedData) return { subjects: 0, chapters: 0, questions: 0, totalMarks: 0 };

    let totalQuestions = 0;
    let totalChapters = 0;
    let totalMarks = 0;
    const subjects = Object.keys(parsedData).length;

    Object.values(parsedData).forEach(subject => {
      totalChapters += Object.keys(subject).length;
      Object.values(subject).forEach(questions => {
        totalQuestions += questions.length;
        questions.forEach(q => { totalMarks += q.marks || 1; });
      });
    });

    return { subjects, chapters: totalChapters, questions: totalQuestions, totalMarks };
  };


  const getLangModeDisplay = () => {
    switch (languageMode) {
      case LANGUAGE_REQUIREMENTS.BOTH: return { text: "Both EN & HI Required", color: "primary" };
      case LANGUAGE_REQUIREMENTS.EN_ONLY: return { text: "English Only", color: "success" };
      case LANGUAGE_REQUIREMENTS.HI_ONLY: return { text: "Hindi Only", color: "warning" };
      case LANGUAGE_REQUIREMENTS.EITHER: return { text: "Either EN or HI", color: "secondary" };
      default: return { text: "Both Languages", color: "primary" };
    }
  };


  const stats = getStatistics();
  const langDisplay = getLangModeDisplay();


  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Master Uploader</Typography>
          <Typography variant="body2" color="text.secondary">
            Bulk upload questions across subjects and chapters instantly.
          </Typography>
        </Box>
        <Chip
          icon={<Languages size={16} />}
          label={langDisplay.text}
          color={langDisplay.color}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Sidebar - Steps */}
        <Box sx={{ width: { lg: 250 }, flexShrink: 0 }}>
          <Stack spacing={2}>
            {[
              { step: 0, label: 'Setup & Config', desc: 'Select class and language' },
              { step: 1, label: 'Preview Data', desc: 'Review parsed questions' },
              { step: 2, label: 'Upload Progress', desc: 'Track upload status' }
            ].map((item, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 2,
                  borderLeft: 4,
                  borderLeftColor: activeTab === item.step ? 'primary.main' : 'transparent',
                  bgcolor: activeTab === item.step ? 'action.selected' : 'background.paper',
                  cursor: 'default'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Chip
                    label={idx + 1}
                    size="small"
                    color={activeTab === item.step ? 'primary' : 'default'}
                    sx={{ fontWeight: 'bold', minWidth: 32 }}
                  />
                  <Typography variant="subtitle2" fontWeight="600">
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {item.desc}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Setup" />
            <Tab label="Preview" disabled={!parsedData} />
            <Tab label="Upload" disabled={!parsedData} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Stack spacing={3} sx={{ mt: 3 }}>
              {/* Configuration */}
              <Card variant="outlined">
                <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)' }} />
                <CardHeader
                  title="Configuration"
                  subheader="Configure the upload settings before selecting your file."
                />
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <FormControl fullWidth>
                      <InputLabel>Select Class</InputLabel>
                      <Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        label="Select Class"
                      >
                        {[6, 7, 8, 9, 10, 11, 12].map(cls => (
                          <MenuItem key={cls} value={cls.toString()}>Class {cls}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" fontWeight="600" gutterBottom>
                        Language Mode
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {[
                          { id: LANGUAGE_REQUIREMENTS.BOTH, label: 'Bilingual' },
                          { id: LANGUAGE_REQUIREMENTS.EN_ONLY, label: 'English' },
                          { id: LANGUAGE_REQUIREMENTS.HI_ONLY, label: 'Hindi' },
                          { id: LANGUAGE_REQUIREMENTS.EITHER, label: 'Flexible' },
                        ].map((item) => (
                          <Chip
                            key={item.id}
                            label={item.label}
                            onClick={() => setLanguageMode(item.id)}
                            color={languageMode === item.id ? 'primary' : 'default'}
                            variant={languageMode === item.id ? 'filled' : 'outlined'}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card variant="outlined">
                <CardHeader
                  title="File Upload"
                  subheader="Upload your CSV file with the standard template."
                />
                <CardContent>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      cursor: selectedClass ? 'pointer' : 'not-allowed',
                      '&:hover': selectedClass ? { bgcolor: 'action.selected' } : {},
                      position: 'relative'
                    }}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileSelect}
                      disabled={!selectedClass}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: selectedClass ? 'pointer' : 'not-allowed' }}
                    />
                    <UploadCloud size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <Typography variant="h6" gutterBottom>
                      {csvFile ? csvFile.name : "Click to upload or drag and drop"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {csvFile ? "File selected. Ready to parse." : "CSV files only"}
                    </Typography>
                    {!selectedClass && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        Please select a class first
                      </Typography>
                    )}
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FileText size={20} />
                      <Box>
                        <Typography variant="body2" fontWeight="600">Need the template?</Typography>
                        <Typography variant="caption" color="text.secondary">Download the latest CSV format</Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download size={14} />}
                      onClick={handleDownloadTemplate}
                      disabled={!selectedClass}
                    >
                      Download CSV
                    </Button>
                  </Box>

                  {errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <AlertTitle>Validation Errors</AlertTitle>
                      <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                        {errors.slice(0, 5).map((e, i) => (
                          <ListItem key={i} sx={{ py: 0 }}>
                            <Typography variant="caption">• {e}</Typography>
                          </ListItem>
                        ))}
                      </List>
                      {errors.length > 5 && (
                        <Typography variant="caption" fontWeight="600">
                          ...and {errors.length - 5} more errors
                        </Typography>
                      )}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {parsedData && (
              <Stack spacing={3} sx={{ mt: 3 }}>
                {/* Statistics */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {[
                    { label: 'Questions', value: stats.questions, color: '#3b82f6' },
                    { label: 'Subjects', value: stats.subjects, color: '#a855f7' },
                    { label: 'Chapters', value: stats.chapters, color: '#ec4899' },
                    { label: 'Total Marks', value: stats.totalMarks, color: '#f97316' }
                  ].map((stat, idx) => (
                    <Card key={idx} variant="outlined" sx={{ flexGrow: 1, minWidth: 150, bgcolor: `${stat.color}15`, borderColor: stat.color }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: stat.color }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={1}>
                          {stat.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                {/* Preview */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="600">Parsed Content Breakdown</Typography>
                  <Button
                    variant="contained"
                    color="success"
                    endIcon={<ArrowRight size={16} />}
                    onClick={handleMasterUpload}
                  >
                    Start Upload
                  </Button>
                </Box>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {Object.keys(parsedData).map((subject) => (
                    <Card key={subject} variant="outlined" sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' } }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight="bold">{subject}</Typography>
                            <Chip label={`${Object.keys(parsedData[subject]).length} Chapters`} size="small" />
                          </Box>
                        }
                        sx={{ bgcolor: 'action.hover', py: 1 }}
                      />
                      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        <List dense>
                          {Object.keys(parsedData[subject]).map((chapter) => (
                            <ListItem key={chapter} divider>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <BookOpen size={16} />
                              </ListItemIcon>
                              <ListItemText
                                primary={chapter}
                                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                              />
                              <Chip
                                label={`${parsedData[subject][chapter].length} Qs`}
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Stack spacing={3} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight="600">Upload Status</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {uploadComplete ? "All uploads completed!" : "Uploading questions..."}
                  </Typography>
                </Box>
                {uploadComplete && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setParsedData(null);
                      setActiveTab(0);
                      setCsvFile(null);
                    }}
                  >
                    Upload Another File
                  </Button>
                )}
              </Box>

              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Stack spacing={1.5}>
                  {uploadProgress.map((item, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: item.status === 'uploading' ? 'primary.main' : 'divider',
                        bgcolor: item.status === 'uploading' ? 'action.selected' : 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                          {item.status === 'pending' && <Loader2 size={24} style={{ opacity: 0.3 }} />}
                          {item.status === 'uploading' && <Loader2 size={24} color="#1976d2" className="animate-spin" />}
                          {item.status === 'success' && <CheckCircle2 size={24} color="#16a34a" />}
                          {item.status === 'error' && <XCircle size={24} color="#dc2626" />}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="600">{item.chapter}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.subject}</Typography>
                          </Box>
                          <Typography variant="caption" color={item.status === 'success' ? 'success.main' : item.status === 'error' ? 'error.main' : 'text.secondary'}>
                            {item.status === 'uploading' ? `Uploading... ${item.uploadedCount}/${item.totalQuestions}` :
                              item.status === 'success' ? `Completed (${item.totalQuestions} Questions)` :
                                item.status === 'error' ? `Failed: ${item.error}` : 'Waiting...'}
                          </Typography>
                          {item.status === 'uploading' && (
                            <LinearProgress variant="determinate" value={(item.uploadedCount / item.totalQuestions) * 100} sx={{ mt: 1 }} />
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </TabPanel>
        </Box>
      </Box>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
}
