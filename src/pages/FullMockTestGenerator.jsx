// // FullMockTestGenerator.jsx (With Auto-Distribute for Hindi/English)
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:3000/api/v1';

// // Official Bihar Board Weightage
// const biharBoardWeightage = {
//   Physics: {
//     totalMCQs: 35,
//     chapters: [
//       { name: 'Electrostatics', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
//       { name: 'Current Electricity', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
//       { name: 'Magnetic Effects of Current and Magnetism', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
//       { name: 'Electromagnetic Induction and Alternating Current', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
//       { name: 'Electromagnetic Waves', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
//       { name: 'Optics', mcqs: 14, difficulty: { easy: 6, medium: 5, hard: 3 } },
//       { name: 'Dual Nature of Matter and Radiation', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Atoms and Nuclei', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
//       { name: 'Electronic Devices', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
//       { name: 'Communication Systems', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } }
//     ]
//   },
//   Mathematics: {
//     totalMCQs: 50,
//     chapters: [
//       { name: 'Relations and Functions', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
//       { name: 'Inverse Trigonometric Functions', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Matrices', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
//       { name: 'Determinants', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
//       { name: 'Continuity and Differentiability', mcqs: 9, difficulty: { easy: 4, medium: 3, hard: 2 } },
//       { name: 'Applications of Derivatives', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
//       { name: 'Integrals', mcqs: 9, difficulty: { easy: 4, medium: 3, hard: 2 } },
//       { name: 'Applications of Integrals', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
//       { name: 'Differential Equations', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
//       { name: 'Vectors', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
//       { name: 'Three Dimensional Geometry', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
//       { name: 'Linear Programming', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
//       { name: 'Probability', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } }
//     ]
//   },
//   Chemistry: {
//     totalMCQs: 35,
//     chapters: [
//       { name: 'Solid State', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Solutions', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
//       { name: 'Electrochemistry', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
//       { name: 'Chemical Kinetics', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
//       { name: 'Surface Chemistry', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
//       { name: 'General Principles and Processes of Isolation of Elements', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
//       { name: 'p-Block Elements', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
//       { name: 'd and f Block Elements', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
//       { name: 'Coordination Compounds', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
//       { name: 'Haloalkanes and Haloarenes', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Alcohols, Phenols and Ethers', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Aldehydes, Ketones and Carboxylic Acids', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
//       { name: 'Organic Compounds Containing Nitrogen', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Biomolecules', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
//       { name: 'Polymers', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
//       { name: 'Chemistry in Everyday Life', mcqs: 3, difficulty: { easy: 2, medium: 1, hard: 0 } }
//     ]
//   },
//   Biology: {
//     totalMCQs: 35,
//     chapters: [
//       { name: 'Reproduction', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
//       { name: 'Genetics and Evolution', mcqs: 18, difficulty: { easy: 7, medium: 7, hard: 4 } },
//       { name: 'Biology and Human Welfare', mcqs: 18, difficulty: { easy: 7, medium: 7, hard: 4 } },
//       { name: 'Biotechnology and Its Applications', mcqs: 18, difficulty: { easy: 7, medium: 7, hard: 4 } },
//       { name: 'Ecology and Environment', mcqs: 10, difficulty: { easy: 4, medium: 4, hard: 2 } }
//     ]
//   },
//   // Hindi and English - Generic 50 MCQs pattern
//   Hindi: {
//     totalMCQs: 50,
//     autoDistribute: true // Flag for auto-distribution
//   },
//   English: {
//     totalMCQs: 50,
//     autoDistribute: true // Flag for auto-distribution
//   }
// };

// const FullMockTestGenerator = () => {
//   const [subjects, setSubjects] = useState([]);
//   const [selectedSubject, setSelectedSubject] = useState(null);
//   const [chapters, setChapters] = useState([]);
//   const [chapterDistribution, setChapterDistribution] = useState({});
//   const [useOfficialPattern, setUseOfficialPattern] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [studentClass] = useState(12);
//   const [stream, setStream] = useState('Science');
//   const [mockTestTitle, setMockTestTitle] = useState('');

//   useEffect(() => {
//     fetchSubjects();
//   }, [stream]);

//   useEffect(() => {
//     if (selectedSubject) {
//       fetchChapters(selectedSubject._id);
//     }
//   }, [selectedSubject]);

//   const fetchSubjects = async () => {
//     try {
//       setLoading(true);
//       const url = `${API_BASE_URL}/utility/subject/class/${studentClass}/stream/${stream}`;
//       const response = await axios.get(url);
//       setSubjects(response.data);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load subjects');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchChapters = async (subjectId) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${API_BASE_URL}/utility/chapters/subject/${subjectId}`);
//       setChapters(response.data);

//       // Initialize with empty distribution
//       const initialDistribution = {};
//       response.data.forEach(chapter => {
//         initialDistribution[chapter._id] = {
//           total: 0,
//           easy: 0,
//           medium: 0,
//           hard: 0,
//           available: chapter.questionCount,
//           name: chapter.name
//         };
//       });
//       setChapterDistribution(initialDistribution);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load chapters');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadOfficialPattern = () => {
//     const officialData = biharBoardWeightage[selectedSubject.name];
//     if (!officialData) {
//       alert('Official Bihar Board pattern not available for this subject');
//       return;
//     }

//     // Check if this subject uses auto-distribution
//     if (officialData.autoDistribute) {
//       autoDistributeQuestions();
//       return;
//     }

//     const newDistribution = { ...chapterDistribution };

//     // Match DB chapters with official chapters
//     officialData.chapters.forEach(officialChapter => {
//       const dbChapter = chapters.find(ch => 
//         ch.name.toLowerCase().includes(officialChapter.name.toLowerCase()) ||
//         officialChapter.name.toLowerCase().includes(ch.name.toLowerCase())
//       );

//       if (dbChapter) {
//         newDistribution[dbChapter._id] = {
//           total: officialChapter.mcqs,
//           easy: officialChapter.difficulty.easy,
//           medium: officialChapter.difficulty.medium,
//           hard: officialChapter.difficulty.hard,
//           available: dbChapter.questionCount,
//           name: dbChapter.name
//         };
//       }
//     });

//     setChapterDistribution(newDistribution);
//     setUseOfficialPattern(true);
//   };

//   const autoDistributeQuestions = () => {
//     const officialData = biharBoardWeightage[selectedSubject?.name];
//     const totalMCQs = officialData?.totalMCQs || 50;

//     const questionsPerChapter = Math.floor(totalMCQs / chapters.length);
//     const remainder = totalMCQs % chapters.length;

//     const newDistribution = {};
//     chapters.forEach((chapter, index) => {
//       const total = questionsPerChapter + (index < remainder ? 1 : 0);
//       newDistribution[chapter._id] = {
//         total: total,
//         easy: Math.ceil(total * 0.4),
//         medium: Math.ceil(total * 0.4),
//         hard: Math.floor(total * 0.2),
//         available: chapter.questionCount,
//         name: chapter.name
//       };
//     });

//     setChapterDistribution(newDistribution);
//     setUseOfficialPattern(true);
//   };

//   const updateChapterQuestions = (chapterId, total) => {
//     const chapter = chapters.find(c => c._id === chapterId);
//     if (total > chapter.questionCount) {
//       alert(`Only ${chapter.questionCount} questions available in this chapter!`);
//       return;
//     }

//     const totalNum = parseInt(total) || 0;
//     setChapterDistribution(prev => ({
//       ...prev,
//       [chapterId]: {
//         ...prev[chapterId],
//         total: totalNum,
//         easy: Math.ceil(totalNum * 0.4),
//         medium: Math.ceil(totalNum * 0.4),
//         hard: Math.floor(totalNum * 0.2)
//       }
//     }));
//     setUseOfficialPattern(false);
//   };

//   const updateDifficulty = (chapterId, difficulty, value) => {
//     const valueNum = parseInt(value) || 0;
//     setChapterDistribution(prev => {
//       const current = prev[chapterId];
//       const updated = { ...current, [difficulty]: valueNum };
//       updated.total = updated.easy + updated.medium + updated.hard;
//       return { ...prev, [chapterId]: updated };
//     });
//     setUseOfficialPattern(false);
//   };

//   const getTotalQuestions = () => {
//     return Object.values(chapterDistribution).reduce((sum, dist) => sum + dist.total, 0);
//   };

//   const getTotalByDifficulty = (difficulty) => {
//     return Object.values(chapterDistribution).reduce((sum, dist) => sum + dist[difficulty], 0);
//   };

//   const getOfficialTotal = () => {
//     const officialData = biharBoardWeightage[selectedSubject?.name];
//     return officialData?.totalMCQs || 50;
//   };

//   const generateMockTest = async () => {
//     const totalQuestions = getTotalQuestions();
//     const expectedTotal = getOfficialTotal();

//     if (totalQuestions === 0) {
//       alert('Please set question distribution for at least one chapter');
//       return;
//     }

//     if (!mockTestTitle.trim()) {
//       alert('Please enter a mock test title');
//       return;
//     }

//     if (useOfficialPattern && totalQuestions !== expectedTotal) {
//       if (!window.confirm(`Total questions (${totalQuestions}) doesn't match Bihar Board pattern (${expectedTotal}). Continue anyway?`)) {
//         return;
//       }
//     }

//     setLoading(true);
//     setError(null);
//     setSuccess(null);

//     try {
//       const allQuestionIds = [];

//       for (const [chapterId, distribution] of Object.entries(chapterDistribution)) {
//         if (distribution.total === 0) continue;

//         const response = await axios.get(`${API_BASE_URL}/utility/question`, {
//           params: {
//             chapterId: chapterId,
//             subjectId: selectedSubject._id
//           }
//         });

//         const chapterQuestions = response.data;

//         // Separate by difficulty
//         const easyQuestions = chapterQuestions.filter(q => q.difficulty === 'easy');
//         const mediumQuestions = chapterQuestions.filter(q => q.difficulty === 'medium');
//         const hardQuestions = chapterQuestions.filter(q => q.difficulty === 'hard');

//         // Check availability
//         if (easyQuestions.length < distribution.easy) {
//           console.warn(`⚠️ ${distribution.name}: Only ${easyQuestions.length} easy questions available (need ${distribution.easy})`);
//         }
//         if (mediumQuestions.length < distribution.medium) {
//           console.warn(`⚠️ ${distribution.name}: Only ${mediumQuestions.length} medium questions available (need ${distribution.medium})`);
//         }
//         if (hardQuestions.length < distribution.hard) {
//           console.warn(`⚠️ ${distribution.name}: Only ${hardQuestions.length} hard questions available (need ${distribution.hard})`);
//         }

//         // Randomly select questions
//         const selectedEasy = getRandomQuestions(easyQuestions, distribution.easy);
//         const selectedMedium = getRandomQuestions(mediumQuestions, distribution.medium);
//         const selectedHard = getRandomQuestions(hardQuestions, distribution.hard);

//         allQuestionIds.push(...selectedEasy.map(q => q._id));
//         allQuestionIds.push(...selectedMedium.map(q => q._id));
//         allQuestionIds.push(...selectedHard.map(q => q._id));

//         console.log(`✅ ${distribution.name}: ${selectedEasy.length}E + ${selectedMedium.length}M + ${selectedHard.length}H`);
//       }

//       // Shuffle the final question order
//       const shuffledQuestions = shuffleArray(allQuestionIds);

//       // Create the mock test
//       const mockTestData = {
//         title: mockTestTitle,
//         description: useOfficialPattern 
//           ? `Bihar Board Pattern - ${selectedSubject.name} Full Mock Test (Official Weightage)`
//           : `${selectedSubject.name} Custom Mock Test`,
//         isBilingual: true,
//         studentClass: studentClass,
//         subjects: [selectedSubject._id],
//         questions: shuffledQuestions,
//         durationInMinutes: 180,
//         stream: stream,
//         totalMarks: shuffledQuestions.length,
//         passingMarks: Math.ceil(shuffledQuestions.length * 0.33),
//         status: 'active',
//         testType: 'full'
//       };

//       await axios.post(`${API_BASE_URL}/mocktest`, mockTestData);

//       setSuccess(`✅ Mock test "${mockTestTitle}" created successfully with ${shuffledQuestions.length} questions!`);
//       setMockTestTitle('');
//       setChapterDistribution({});
//       setSelectedSubject(null);
//       setChapters([]);

//     } catch (err) {
//       setError(`Failed to generate mock test: ${err.response?.data?.message || err.message}`);
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getRandomQuestions = (questions, count) => {
//     const shuffled = [...questions].sort(() => 0.5 - Math.random());
//     return shuffled.slice(0, Math.min(count, questions.length));
//   };

//   const shuffleArray = (array) => {
//     const shuffled = [...array];
//     for (let i = shuffled.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//     }
//     return shuffled;
//   };

//   const hasOfficialPattern = selectedSubject && biharBoardWeightage[selectedSubject.name];
//   const isAutoDistributeSubject = selectedSubject && biharBoardWeightage[selectedSubject.name]?.autoDistribute;

//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         <h1 style={styles.title}>🎓 Bihar Board Mock Test Generator</h1>
//         <p style={styles.subtitle}>Create mock tests with official BSEB weightage or customize your own</p>
//       </div>

//       {/* Stream Selection */}
//       <div style={styles.card}>
//         <h2 style={styles.cardTitle}>Step 1: Select Stream</h2>
//         <div style={styles.row}>
//           <button 
//             style={{...styles.streamButton, ...(stream === 'Science' ? styles.streamButtonActive : {})}}
//             onClick={() => setStream('Science')}
//           >
//             🧪 Science
//           </button>
//           <button 
//             style={{...styles.streamButton, ...(stream === 'Commerce' ? styles.streamButtonActive : {})}}
//             onClick={() => setStream('Commerce')}
//           >
//             💼 Commerce
//           </button>
//           <button 
//             style={{...styles.streamButton, ...(stream === 'Arts' ? styles.streamButtonActive : {})}}
//             onClick={() => setStream('Arts')}
//           >
//             🎨 Arts
//           </button>
//         </div>
//       </div>

//       {/* Subject Selection */}
//       <div style={styles.card}>
//         <h2 style={styles.cardTitle}>Step 2: Select Subject</h2>
//         {loading && <p style={styles.loading}>Loading subjects...</p>}
//         <div style={styles.subjectGrid}>
//           {subjects.map(subject => (
//             <button
//               key={subject._id}
//               style={{
//                 ...styles.subjectCard,
//                 ...(selectedSubject?._id === subject._id ? styles.subjectCardSelected : {})
//               }}
//               onClick={() => setSelectedSubject(subject)}
//             >
//               <span style={styles.subjectIcon}>📚</span>
//               <span style={styles.subjectName}>{subject.name}</span>
//               {biharBoardWeightage[subject.name] && (
//                 <span style={styles.subjectBadge}>
//                   {biharBoardWeightage[subject.name].autoDistribute ? 'Auto-Distribute' : 'Official Pattern'} ✓
//                 </span>
//               )}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Pattern Selection */}
//       {selectedSubject && hasOfficialPattern && (
//         <div style={styles.card}>
//           <h2 style={styles.cardTitle}>Step 3: Choose Pattern</h2>
//           <div style={styles.patternRow}>
//             <button
//               style={{...styles.patternButton, ...(useOfficialPattern ? styles.patternButtonActive : {})}}
//               onClick={loadOfficialPattern}
//             >
//               <span style={styles.patternIcon}>
//                 {isAutoDistributeSubject ? '⚡' : '📋'}
//               </span>
//               <div>
//                 <div style={styles.patternTitle}>
//                   {isAutoDistributeSubject ? 'Auto-Distribute Equally' : 'Official Bihar Board Pattern'}
//                 </div>
//                 <div style={styles.patternDesc}>
//                   {isAutoDistributeSubject 
//                     ? `${biharBoardWeightage[selectedSubject.name].totalMCQs} MCQs distributed equally across all chapters`
//                     : `${biharBoardWeightage[selectedSubject.name].totalMCQs} MCQs with official chapter weightage`
//                   }
//                 </div>
//               </div>
//             </button>
//             <button
//               style={{...styles.patternButton, ...(!useOfficialPattern ? styles.patternButtonActive : {})}}
//               onClick={() => {
//                 setUseOfficialPattern(false);
//                 const newDist = {};
//                 chapters.forEach(ch => {
//                   newDist[ch._id] = {
//                     total: 0,
//                     easy: 0,
//                     medium: 0,
//                     hard: 0,
//                     available: ch.questionCount,
//                     name: ch.name
//                   };
//                 });
//                 setChapterDistribution(newDist);
//               }}
//             >
//               <span style={styles.patternIcon}>✏️</span>
//               <div>
//                 <div style={styles.patternTitle}>Custom Pattern</div>
//                 <div style={styles.patternDesc}>Manually set questions per chapter</div>
//               </div>
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Mock Test Title */}
//       {selectedSubject && (
//         <div style={styles.card}>
//           <h2 style={styles.cardTitle}>Step {hasOfficialPattern ? '4' : '3'}: Enter Mock Test Title</h2>
//           <input
//             type="text"
//             style={styles.input}
//             placeholder={`e.g., Bihar Board ${selectedSubject.name} Mock Test - Series 1`}
//             value={mockTestTitle}
//             onChange={(e) => setMockTestTitle(e.target.value)}
//           />
//         </div>
//       )}

//       {/* Chapter Distribution */}
//       {selectedSubject && chapters.length > 0 && (
//         <div style={styles.card}>
//           <div style={styles.cardHeader}>
//             <h2 style={styles.cardTitle}>
//               Step {hasOfficialPattern ? '5' : '4'}: Question Distribution
//               {useOfficialPattern && <span style={styles.officialBadge}>
//                 {isAutoDistributeSubject ? 'Auto-Distributed' : 'Official Pattern Loaded'}
//               </span>}
//             </h2>
//             {!hasOfficialPattern && (
//               <button style={styles.autoButton} onClick={autoDistributeQuestions}>
//                 ⚡ Auto Distribute Equally
//               </button>
//             )}
//           </div>

//           <div style={styles.statsRow}>
//             <div style={styles.statCard}>
//               <span style={styles.statLabel}>Total Questions</span>
//               <span style={{...styles.statValue, color: getTotalQuestions() === getOfficialTotal() ? '#10B981' : '#F59E0B'}}>
//                 {getTotalQuestions()} {useOfficialPattern && `/ ${getOfficialTotal()}`}
//               </span>
//             </div>
//             <div style={styles.statCard}>
//               <span style={styles.statLabel}>Easy</span>
//               <span style={styles.statValue}>{getTotalByDifficulty('easy')}</span>
//             </div>
//             <div style={styles.statCard}>
//               <span style={styles.statLabel}>Medium</span>
//               <span style={styles.statValue}>{getTotalByDifficulty('medium')}</span>
//             </div>
//             <div style={styles.statCard}>
//               <span style={styles.statLabel}>Hard</span>
//               <span style={styles.statValue}>{getTotalByDifficulty('hard')}</span>
//             </div>
//           </div>

//           <div style={styles.chapterList}>
//             {chapters.map((chapter, index) => {
//               const dist = chapterDistribution[chapter._id] || {};
//               return (
//                 <div key={chapter._id} style={styles.chapterItem}>
//                   <div style={styles.chapterHeader}>
//                     <span style={styles.chapterNumber}>{index + 1}</span>
//                     <span style={styles.chapterName}>{chapter.name}</span>
//                     <span style={styles.chapterAvailable}>
//                       {chapter.questionCount} available
//                     </span>
//                   </div>

//                   <div style={styles.chapterInputRow}>
//                     <div style={styles.inputWrapper}>
//                       <label style={styles.inputLabel}>Total</label>
//                       <input
//                         type="number"
//                         min="0"
//                         max={chapter.questionCount}
//                         style={styles.chapterInput}
//                         value={dist.total || 0}
//                         onChange={(e) => updateChapterQuestions(chapter._id, e.target.value)}
//                       />
//                     </div>

//                     {dist.total > 0 && (
//                       <>
//                         <div style={styles.inputWrapper}>
//                           <label style={styles.inputLabel}>Easy</label>
//                           <input
//                             type="number"
//                             min="0"
//                             max={dist.total}
//                             style={{...styles.chapterInput, ...styles.inputEasy}}
//                             value={dist.easy || 0}
//                             onChange={(e) => updateDifficulty(chapter._id, 'easy', e.target.value)}
//                           />
//                         </div>
//                         <div style={styles.inputWrapper}>
//                           <label style={styles.inputLabel}>Medium</label>
//                           <input
//                             type="number"
//                             min="0"
//                             max={dist.total}
//                             style={{...styles.chapterInput, ...styles.inputMedium}}
//                             value={dist.medium || 0}
//                             onChange={(e) => updateDifficulty(chapter._id, 'medium', e.target.value)}
//                           />
//                         </div>
//                         <div style={styles.inputWrapper}>
//                           <label style={styles.inputLabel}>Hard</label>
//                           <input
//                             type="number"
//                             min="0"
//                             max={dist.total}
//                             style={{...styles.chapterInput, ...styles.inputHard}}
//                             value={dist.hard || 0}
//                             onChange={(e) => updateDifficulty(chapter._id, 'hard', e.target.value)}
//                           />
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Generate Button */}
//       {selectedSubject && chapters.length > 0 && mockTestTitle && (
//         <button
//           style={{
//             ...styles.generateButton,
//             ...(loading ? styles.generateButtonDisabled : {})
//           }}
//           onClick={generateMockTest}
//           disabled={loading}
//         >
//           {loading ? '⏳ Generating Mock Test...' : '🚀 Generate Mock Test'}
//         </button>
//       )}

//       {/* Success/Error Messages */}
//       {success && <div style={styles.successAlert}>{success}</div>}
//       {error && <div style={styles.errorAlert}>{error}</div>}
//     </div>
//   );
// };

// // Styles (same as before, adding autoButton)
// const styles = {
//   container: {
//     maxWidth: '1200px',
//     margin: '0 auto',
//     padding: '24px',
//     backgroundColor: '#F8F9FB',
//     minHeight: '100vh',
//   },
//   header: {
//     textAlign: 'center',
//     marginBottom: '32px',
//   },
//   title: {
//     fontSize: '32px',
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: '8px',
//   },
//   subtitle: {
//     fontSize: '16px',
//     color: '#6B7280',
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: '20px',
//     padding: '24px',
//     marginBottom: '24px',
//     boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
//     border: '1.5px solid #E5E7EB',
//   },
//   cardTitle: {
//     fontSize: '20px',
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: '16px',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//   },
//   cardHeader: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: '16px',
//   },
//   officialBadge: {
//     fontSize: '12px',
//     fontWeight: '600',
//     padding: '4px 12px',
//     backgroundColor: '#10B981',
//     color: '#FFFFFF',
//     borderRadius: '6px',
//   },
//   autoButton: {
//     padding: '8px 16px',
//     backgroundColor: '#10B981',
//     color: '#FFFFFF',
//     border: 'none',
//     borderRadius: '8px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   row: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr 1fr',
//     gap: '16px',
//   },
//   streamButton: {
//     padding: '16px',
//     fontSize: '16px',
//     fontWeight: '600',
//     border: '1.5px solid #E5E7EB',
//     borderRadius: '12px',
//     backgroundColor: '#FFFFFF',
//     cursor: 'pointer',
//     transition: 'all 0.2s',
//   },
//   streamButtonActive: {
//     backgroundColor: '#5B6CF5',
//     color: '#FFFFFF',
//     borderColor: '#5B6CF5',
//   },
//   input: {
//     padding: '12px',
//     fontSize: '15px',
//     border: '1.5px solid #E5E7EB',
//     borderRadius: '12px',
//     backgroundColor: '#FFFFFF',
//     color: '#1F2937',
//     outline: 'none',
//     width: '100%',
//   },
//   subjectGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
//     gap: '16px',
//   },
//   subjectCard: {
//     padding: '20px',
//     border: '1.5px solid #E5E7EB',
//     borderRadius: '16px',
//     backgroundColor: '#FFFFFF',
//     cursor: 'pointer',
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     gap: '12px',
//     transition: 'all 0.2s',
//     outline: 'none',
//   },
//   subjectCardSelected: {
//     backgroundColor: '#5B6CF5',
//     borderColor: '#5B6CF5',
//     color: '#FFFFFF',
//   },
//   subjectIcon: {
//     fontSize: '32px',
//   },
//   subjectName: {
//     fontSize: '16px',
//     fontWeight: '600',
//   },
//   subjectBadge: {
//     fontSize: '11px',
//     padding: '4px 8px',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderRadius: '6px',
//     fontWeight: '600',
//   },
//   patternRow: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr',
//     gap: '16px',
//   },
//   patternButton: {
//     padding: '20px',
//     border: '1.5px solid #E5E7EB',
//     borderRadius: '16px',
//     backgroundColor: '#FFFFFF',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '16px',
//     transition: 'all 0.2s',
//     outline: 'none',
//     textAlign: 'left',
//   },
//   patternButtonActive: {
//     borderColor: '#5B6CF5',
//     backgroundColor: '#F0F2FF',
//   },
//   patternIcon: {
//     fontSize: '32px',
//   },
//   patternTitle: {
//     fontSize: '16px',
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: '4px',
//   },
//   patternDesc: {
//     fontSize: '13px',
//     color: '#6B7280',
//   },
//   statsRow: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(4, 1fr)',
//     gap: '16px',
//     marginBottom: '24px',
//   },
//   statCard: {
//     padding: '16px',
//     backgroundColor: '#F8F9FB',
//     borderRadius: '12px',
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     gap: '8px',
//   },
//   statLabel: {
//     fontSize: '13px',
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   statValue: {
//     fontSize: '24px',
//     fontWeight: '700',
//     color: '#1F2937',
//   },
//   chapterList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   chapterItem: {
//     padding: '16px',
//     border: '1.5px solid #E5E7EB',
//     borderRadius: '12px',
//     backgroundColor: '#F8F9FB',
//   },
//   chapterHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     marginBottom: '12px',
//   },
//   chapterNumber: {
//     width: '32px',
//     height: '32px',
//     borderRadius: '8px',
//     backgroundColor: '#5B6CF5',
//     color: '#FFFFFF',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '14px',
//     fontWeight: '700',
//   },
//   chapterName: {
//     flex: 1,
//     fontSize: '15px',
//     fontWeight: '600',
//     color: '#1F2937',
//   },
//   chapterAvailable: {
//     fontSize: '12px',
//     color: '#6B7280',
//     backgroundColor: '#FFFFFF',
//     padding: '4px 12px',
//     borderRadius: '6px',
//   },
//   chapterInputRow: {
//     display: 'flex',
//     alignItems: 'flex-end',
//     gap: '12px',
//   },
//   inputWrapper: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '4px',
//   },
//   inputLabel: {
//     fontSize: '11px',
//     fontWeight: '600',
//     color: '#6B7280',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//   },
//   chapterInput: {
//     width: '80px',
//     padding: '8px 12px',
//     fontSize: '15px',
//     fontWeight: '600',
//     border: '1.5px solid #E5E7EB',
//     borderRadius: '8px',
//     backgroundColor: '#FFFFFF',
//     outline: 'none',
//   },
//   inputEasy: {
//     borderColor: '#10B981',
//   },
//   inputMedium: {
//     borderColor: '#F59E0B',
//   },
//   inputHard: {
//     borderColor: '#EF4444',
//   },
//   generateButton: {
//     width: '100%',
//     padding: '16px',
//     fontSize: '18px',
//     fontWeight: '700',
//     backgroundColor: '#5B6CF5',
//     color: '#FFFFFF',
//     border: 'none',
//     borderRadius: '12px',
//     cursor: 'pointer',
//     marginBottom: '24px',
//   },
//   generateButtonDisabled: {
//     opacity: 0.6,
//     cursor: 'not-allowed',
//   },
//   successAlert: {
//     padding: '16px',
//     backgroundColor: '#10B981',
//     color: '#FFFFFF',
//     borderRadius: '12px',
//     fontSize: '15px',
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   errorAlert: {
//     padding: '16px',
//     backgroundColor: '#EF4444',
//     color: '#FFFFFF',
//     borderRadius: '12px',
//     fontSize: '15px',
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   loading: {
//     textAlign: 'center',
//     color: '#6B7280',
//     fontSize: '15px',
//   },
// };

// export default FullMockTestGenerator;

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Grid,
  Chip,
  Alert,
  Paper,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material';
import {
  Science as ScienceIcon,
  Business as BusinessIcon,
  Palette as ArtsIcon,
  AutoAwesome as AutoIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  FlashOn as FlashIcon
} from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const optionMap = { A: 0, B: 1, C: 2, D: 3 };

// Official Bihar Board Weightage (same as original)
const biharBoardWeightage = {
  Physics: {
    totalMCQs: 35,
    chapters: [
      { name: 'Electrostatics', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
      { name: 'Current Electricity', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
      { name: 'Magnetic Effects of Current and Magnetism', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
      { name: 'Electromagnetic Induction and Alternating Current', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
      { name: 'Electromagnetic Waves', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
      { name: 'Optics', mcqs: 14, difficulty: { easy: 6, medium: 5, hard: 3 } },
      { name: 'Dual Nature of Matter and Radiation', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Atoms and Nuclei', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
      { name: 'Electronic Devices', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
      { name: 'Communication Systems', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } }
    ]
  },
  Mathematics: {
    totalMCQs: 50,
    chapters: [
      { name: 'Relations and Functions', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
      { name: 'Inverse Trigonometric Functions', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Matrices', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
      { name: 'Determinants', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
      { name: 'Continuity and Differentiability', mcqs: 9, difficulty: { easy: 4, medium: 3, hard: 2 } },
      { name: 'Applications of Derivatives', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
      { name: 'Integrals', mcqs: 9, difficulty: { easy: 4, medium: 3, hard: 2 } },
      { name: 'Applications of Integrals', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
      { name: 'Differential Equations', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
      { name: 'Vectors', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
      { name: 'Three Dimensional Geometry', mcqs: 7, difficulty: { easy: 3, medium: 3, hard: 1 } },
      { name: 'Linear Programming', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
      { name: 'Probability', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } }
    ]
  },
  Chemistry: {
    totalMCQs: 35,
    chapters: [
      { name: 'Solid State', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Solutions', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
      { name: 'Electrochemistry', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
      { name: 'Chemical Kinetics', mcqs: 5, difficulty: { easy: 2, medium: 2, hard: 1 } },
      { name: 'Surface Chemistry', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
      { name: 'General Principles and Processes of Isolation of Elements', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
      { name: 'p-Block Elements', mcqs: 8, difficulty: { easy: 3, medium: 3, hard: 2 } },
      { name: 'd and f Block Elements', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
      { name: 'Coordination Compounds', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
      { name: 'Haloalkanes and Haloarenes', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Alcohols, Phenols and Ethers', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Aldehydes, Ketones and Carboxylic Acids', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
      { name: 'Organic Compounds Containing Nitrogen', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Biomolecules', mcqs: 4, difficulty: { easy: 2, medium: 1, hard: 1 } },
      { name: 'Polymers', mcqs: 3, difficulty: { easy: 1, medium: 2, hard: 0 } },
      { name: 'Chemistry in Everyday Life', mcqs: 3, difficulty: { easy: 2, medium: 1, hard: 0 } }
    ]
  },
  Biology: {
    totalMCQs: 35,
    chapters: [
      { name: 'Reproduction', mcqs: 6, difficulty: { easy: 2, medium: 3, hard: 1 } },
      { name: 'Genetics and Evolution', mcqs: 18, difficulty: { easy: 7, medium: 7, hard: 4 } },
      { name: 'Biology and Human Welfare', mcqs: 18, difficulty: { easy: 7, medium: 7, hard: 4 } },
      { name: 'Biotechnology and Its Applications', mcqs: 18, difficulty: { easy: 7, medium: 7, hard: 4 } },
      { name: 'Ecology and Environment', mcqs: 10, difficulty: { easy: 4, medium: 4, hard: 2 } }
    ]
  },
  Hindi: {
    totalMCQs: 50,
    autoDistribute: true
  },
  English: {
    totalMCQs: 50,
    autoDistribute: true
  }
};

export default function FullMockTestGenerator() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterDistribution, setChapterDistribution] = useState({});
  const [useOfficialPattern, setUseOfficialPattern] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [studentClass] = useState(12);
  const [stream, setStream] = useState('Science');
  const [mockTestTitle, setMockTestTitle] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, [stream]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject._id);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/utility/subject/class/${studentClass}/stream/${stream}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSubjects(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };


  const fetchChapters = async (subjectId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/utility/chapters/subject/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setChapters(response.data);

      const initialDistribution = {};
      response.data.forEach(chapter => {
        initialDistribution[chapter._id] = {
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          available: chapter.questionCount,
          name: chapter.name
        };
      });
      setChapterDistribution(initialDistribution);
      setError(null);
    } catch (err) {
      setError('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };


  const loadOfficialPattern = () => {
    const officialData = biharBoardWeightage[selectedSubject.name];
    if (!officialData) {
      alert('Official Bihar Board pattern not available for this subject');
      return;
    }

    if (officialData.autoDistribute) {
      autoDistributeQuestions();
      return;
    }

    const newDistribution = { ...chapterDistribution };

    officialData.chapters.forEach(officialChapter => {
      const dbChapter = chapters.find(ch =>
        ch.name.toLowerCase().includes(officialChapter.name.toLowerCase()) ||
        officialChapter.name.toLowerCase().includes(ch.name.toLowerCase())
      );

      if (dbChapter) {
        newDistribution[dbChapter._id] = {
          total: officialChapter.mcqs,
          easy: officialChapter.difficulty.easy,
          medium: officialChapter.difficulty.medium,
          hard: officialChapter.difficulty.hard,
          available: dbChapter.questionCount,
          name: dbChapter.name
        };
      }
    });

    setChapterDistribution(newDistribution);
    setUseOfficialPattern(true);
  };

  const autoDistributeQuestions = () => {
    const officialData = biharBoardWeightage[selectedSubject?.name];
    const totalMCQs = officialData?.totalMCQs || 50;

    const questionsPerChapter = Math.floor(totalMCQs / chapters.length);
    const remainder = totalMCQs % chapters.length;

    const newDistribution = {};
    chapters.forEach((chapter, index) => {
      const total = questionsPerChapter + (index < remainder ? 1 : 0);
      newDistribution[chapter._id] = {
        total: total,
        easy: Math.ceil(total * 0.4),
        medium: Math.ceil(total * 0.4),
        hard: Math.floor(total * 0.2),
        available: chapter.questionCount,
        name: chapter.name
      };
    });

    setChapterDistribution(newDistribution);
    setUseOfficialPattern(true);
  };

  const updateChapterQuestions = (chapterId, total) => {
    const chapter = chapters.find(c => c._id === chapterId);
    if (total > chapter.questionCount) {
      alert(`Only ${chapter.questionCount} questions available in this chapter!`);
      return;
    }

    const totalNum = parseInt(total) || 0;
    setChapterDistribution(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        total: totalNum,
        easy: Math.ceil(totalNum * 0.4),
        medium: Math.ceil(totalNum * 0.4),
        hard: Math.floor(totalNum * 0.2)
      }
    }));
    setUseOfficialPattern(false);
  };

  const updateDifficulty = (chapterId, difficulty, value) => {
    const valueNum = parseInt(value) || 0;
    setChapterDistribution(prev => {
      const current = prev[chapterId];
      const updated = { ...current, [difficulty]: valueNum };
      updated.total = updated.easy + updated.medium + updated.hard;
      return { ...prev, [chapterId]: updated };
    });
    setUseOfficialPattern(false);
  };

  const getTotalQuestions = () => {
    return Object.values(chapterDistribution).reduce((sum, dist) => sum + dist.total, 0);
  };

  const getTotalByDifficulty = (difficulty) => {
    return Object.values(chapterDistribution).reduce((sum, dist) => sum + dist[difficulty], 0);
  };

  const getOfficialTotal = () => {
    const officialData = biharBoardWeightage[selectedSubject?.name];
    return officialData?.totalMCQs || 50;
  };

  const generateMockTest = async () => {
    const totalQuestions = getTotalQuestions();
    const expectedTotal = getOfficialTotal();

    if (totalQuestions === 0) {
      alert('Please set question distribution for at least one chapter');
      return;
    }

    if (!mockTestTitle.trim()) {
      alert('Please enter a mock test title');
      return;
    }

    if (useOfficialPattern && totalQuestions !== expectedTotal) {
      if (!window.confirm(`Total questions (${totalQuestions}) doesn't match Bihar Board pattern (${expectedTotal}). Continue anyway?`)) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const allQuestionIds = [];

      for (const [chapterId, distribution] of Object.entries(chapterDistribution)) {
        if (distribution.total === 0) continue;

        const response = await axios.get(`${API_BASE_URL}/utility/question`, {
          params: {
            chapterId: chapterId,
            subjectId: selectedSubject._id
          },
          headers: headers
        });

        const chapterQuestions = response.data;

        const easyQuestions = chapterQuestions.filter(q => q.difficulty === 'easy');
        const mediumQuestions = chapterQuestions.filter(q => q.difficulty === 'medium');
        const hardQuestions = chapterQuestions.filter(q => q.difficulty === 'hard');

        const selectedEasy = getRandomQuestions(easyQuestions, distribution.easy);
        const selectedMedium = getRandomQuestions(mediumQuestions, distribution.medium);
        const selectedHard = getRandomQuestions(hardQuestions, distribution.hard);

        allQuestionIds.push(...selectedEasy.map(q => q._id));
        allQuestionIds.push(...selectedMedium.map(q => q._id));
        allQuestionIds.push(...selectedHard.map(q => q._id));
      }

      const shuffledQuestions = shuffleArray(allQuestionIds);

      const mockTestData = {
        title: mockTestTitle,
        description: useOfficialPattern
          ? `Bihar Board Pattern - ${selectedSubject.name} Full Mock Test (Official Weightage)`
          : `${selectedSubject.name} Custom Mock Test`,
        isBilingual: true,
        studentClass: studentClass,
        subjects: [selectedSubject._id],
        questions: shuffledQuestions,
        durationInMinutes: 180,
        stream: stream,
        totalMarks: shuffledQuestions.length,
        passingMarks: Math.ceil(shuffledQuestions.length * 0.33),
        status: 'active',
        testType: 'full'
      };

      await axios.post(`${API_BASE_URL}/mocktest`, mockTestData, {
        headers: headers
      });

      setSuccess(`✅ Mock test "${mockTestTitle}" created successfully with ${shuffledQuestions.length} questions!`);
      setMockTestTitle('');
      setChapterDistribution({});
      setSelectedSubject(null);
      setChapters([]);

    } catch (err) {
      setError(`Failed to generate mock test: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const getRandomQuestions = (questions, count) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, questions.length));
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const hasOfficialPattern = selectedSubject && biharBoardWeightage[selectedSubject.name];
  const isAutoDistributeSubject = selectedSubject && biharBoardWeightage[selectedSubject.name]?.autoDistribute;

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 }, bgcolor: '#F8F9FB', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          🎓 Bihar Board Mock Test Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create mock tests with official BSEB weightage or customize your own
        </Typography>
      </Box>

      {/* Stream Selection */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardHeader title="Step 1: Select Stream" titleTypographyProps={{ variant: 'h6', fontWeight: 700 }} />
        <CardContent>
          <ToggleButtonGroup
            value={stream}
            exclusive
            onChange={(e, val) => val && setStream(val)}
            fullWidth
          >
            <ToggleButton value="Science">
              <ScienceIcon sx={{ mr: 1 }} /> Science
            </ToggleButton>
            <ToggleButton value="Commerce">
              <BusinessIcon sx={{ mr: 1 }} /> Commerce
            </ToggleButton>
            <ToggleButton value="Arts">
              <ArtsIcon sx={{ mr: 1 }} /> Arts
            </ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Subject Selection */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardHeader title="Step 2: Select Subject" titleTypographyProps={{ variant: 'h6', fontWeight: 700 }} />
        <CardContent>
          {loading && <Typography color="text.secondary">Loading subjects...</Typography>}
          <Grid container spacing={2}>
            {subjects.map(subject => (
              <Grid item xs={12} sm={6} md={4} key={subject._id}>
                <Paper
                  variant="outlined"
                  onClick={() => setSelectedSubject(subject)}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    bgcolor: selectedSubject?._id === subject._id ? 'primary.main' : 'background.paper',
                    color: selectedSubject?._id === subject._id ? 'primary.contrastText' : 'text.primary',
                    borderColor: selectedSubject?._id === subject._id ? 'primary.main' : 'divider',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 1 }}>📚</Typography>
                  <Typography variant="subtitle1" fontWeight="600">{subject.name}</Typography>
                  {biharBoardWeightage[subject.name] && (
                    <Chip
                      label={biharBoardWeightage[subject.name].autoDistribute ? 'Auto-Distribute' : 'Official Pattern'}
                      size="small"
                      color={selectedSubject?._id === subject._id ? 'default' : 'primary'}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Pattern Selection */}
      {selectedSubject && hasOfficialPattern && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardHeader title="Step 3: Choose Pattern" titleTypographyProps={{ variant: 'h6', fontWeight: 700 }} />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  onClick={loadOfficialPattern}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderColor: useOfficialPattern ? 'primary.main' : 'divider',
                    bgcolor: useOfficialPattern ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">
                      {isAutoDistributeSubject ? '⚡' : '📋'}
                    </Typography>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="700">
                        {isAutoDistributeSubject ? 'Auto-Distribute Equally' : 'Official Bihar Board Pattern'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAutoDistributeSubject
                          ? `${biharBoardWeightage[selectedSubject.name].totalMCQs} MCQs distributed equally`
                          : `${biharBoardWeightage[selectedSubject.name].totalMCQs} MCQs with official weightage`
                        }
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  onClick={() => {
                    setUseOfficialPattern(false);
                    const newDist = {};
                    chapters.forEach(ch => {
                      newDist[ch._id] = {
                        total: 0,
                        easy: 0,
                        medium: 0,
                        hard: 0,
                        available: ch.questionCount,
                        name: ch.name
                      };
                    });
                    setChapterDistribution(newDist);
                  }}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderColor: !useOfficialPattern ? 'primary.main' : 'divider',
                    bgcolor: !useOfficialPattern ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">✏️</Typography>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="700">Custom Pattern</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Manually set questions per chapter
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Mock Test Title */}
      {selectedSubject && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardHeader
            title={`Step ${hasOfficialPattern ? '4' : '3'}: Enter Mock Test Title`}
            titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
          />
          <CardContent>
            <TextField
              fullWidth
              placeholder={`e.g., Bihar Board ${selectedSubject.name} Mock Test - Series 1`}
              value={mockTestTitle}
              onChange={(e) => setMockTestTitle(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Chapter Distribution */}
      {selectedSubject && chapters.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight="700">
                    Step {hasOfficialPattern ? '5' : '4'}: Question Distribution
                  </Typography>
                  {useOfficialPattern && (
                    <Chip
                      label={isAutoDistributeSubject ? 'Auto-Distributed' : 'Official Pattern Loaded'}
                      color="success"
                      size="small"
                      icon={<CheckIcon />}
                    />
                  )}
                </Box>
                {!hasOfficialPattern && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<FlashIcon />}
                    onClick={autoDistributeQuestions}
                  >
                    Auto Distribute
                  </Button>
                )}
              </Box>
            }
          />
          <CardContent>
            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">Total Questions</Typography>
                  <Typography
                    variant="h4"
                    fontWeight="700"
                    color={getTotalQuestions() === getOfficialTotal() ? 'success.main' : 'warning.main'}
                  >
                    {getTotalQuestions()}
                    {useOfficialPattern && <Typography component="span" variant="h6" color="text.secondary"> / {getOfficialTotal()}</Typography>}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">Easy</Typography>
                  <Typography variant="h4" fontWeight="700">{getTotalByDifficulty('easy')}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">Medium</Typography>
                  <Typography variant="h4" fontWeight="700">{getTotalByDifficulty('medium')}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">Hard</Typography>
                  <Typography variant="h4" fontWeight="700">{getTotalByDifficulty('hard')}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* Chapter List */}
            <Stack spacing={1.5}>
              {chapters.map((chapter, index) => {
                const dist = chapterDistribution[chapter._id] || {};
                return (
                  <Paper key={chapter._id} variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Chip label={index + 1} color="primary" size="small" sx={{ fontWeight: 700 }} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ flexGrow: 1 }}>
                        {chapter.name}
                      </Typography>
                      <Chip label={`${chapter.questionCount} available`} size="small" variant="outlined" />
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Total"
                          type="number"
                          size="small"
                          fullWidth
                          inputProps={{ min: 0, max: chapter.questionCount }}
                          value={dist.total || 0}
                          onChange={(e) => updateChapterQuestions(chapter._id, e.target.value)}
                        />
                      </Grid>

                      {dist.total > 0 && (
                        <>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Easy"
                              type="number"
                              size="small"
                              fullWidth
                              inputProps={{ min: 0, max: dist.total }}
                              value={dist.easy || 0}
                              onChange={(e) => updateDifficulty(chapter._id, 'easy', e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderColor: 'success.main' } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Medium"
                              type="number"
                              size="small"
                              fullWidth
                              inputProps={{ min: 0, max: dist.total }}
                              value={dist.medium || 0}
                              onChange={(e) => updateDifficulty(chapter._id, 'medium', e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderColor: 'warning.main' } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Hard"
                              type="number"
                              size="small"
                              fullWidth
                              inputProps={{ min: 0, max: dist.total }}
                              value={dist.hard || 0}
                              onChange={(e) => updateDifficulty(chapter._id, 'hard', e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderColor: 'error.main' } }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {selectedSubject && chapters.length > 0 && mockTestTitle && (
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={generateMockTest}
          disabled={loading}
          sx={{ mb: 3, py: 2, fontSize: '1.125rem', fontWeight: 700, borderRadius: 2 }}
        >
          {loading ? '⏳ Generating Mock Test...' : '🚀 Generate Mock Test'}
        </Button>
      )}

      {/* Alerts */}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
    </Box>
  );
}
