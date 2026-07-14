"""
The actual dataset. Each skill has a canonical name, a category, alias
spellings, and a set of (field, weight) pairs indicating how relevant that
skill is to different job fields (0-1 scale). This drives both skill
extraction (skill_extractor.py) and field detection (field_detector.py).

Not every skill has field weights assigned — general tools like Git aren't
strongly diagnostic of any one field, so they're left field-less on purpose
rather than assigned an arbitrary weight.
"""

FIELDS = [
    {"name": "Backend Development", "description": "Server-side application and API development."},
    {"name": "Frontend Development", "description": "Client-side, browser-facing application development."},
    {"name": "Full Stack Development", "description": "End-to-end development across frontend and backend."},
    {"name": "Data Science", "description": "Data analysis, statistics, and applied machine learning."},
    {"name": "Machine Learning Engineering", "description": "Building and deploying ML models in production."},
    {"name": "DevOps & Cloud", "description": "Infrastructure, deployment pipelines, and cloud operations."},
    {"name": "QA & Testing", "description": "Test automation and quality assurance."},
    {"name": "Mobile Development", "description": "iOS, Android, and cross-platform mobile applications."},
]

CATEGORIES = [
    "Languages", "Frontend", "Backend", "Databases",
    "Cloud & DevOps", "AI & ML", "Tools", "Concepts", "Soft Skills", "Mobile",
]

# name -> (category, [aliases], {field: weight})
SKILLS = {
    # Languages
    "Python": ("Languages", [], {"Backend Development": 0.6, "Data Science": 0.9, "Machine Learning Engineering": 0.9, "DevOps & Cloud": 0.3}),
    "Java": ("Languages", [], {"Backend Development": 0.6}),
    "JavaScript": ("Languages", [], {"Frontend Development": 0.9, "Full Stack Development": 0.7, "Backend Development": 0.3}),
    "TypeScript": ("Languages", [], {"Frontend Development": 0.7, "Full Stack Development": 0.6}),
    "C": ("Languages", [], {}),
    "C++": ("Languages", [], {}),
    "C#": ("Languages", [], {"Backend Development": 0.4}),
    "Go": ("Languages", [], {"Backend Development": 0.5, "DevOps & Cloud": 0.3}),
    "Rust": ("Languages", [], {"Backend Development": 0.3}),
    "Kotlin": ("Languages", [], {"Mobile Development": 0.7, "Backend Development": 0.2}),
    "Swift": ("Languages", [], {"Mobile Development": 0.8}),
    "PHP": ("Languages", [], {"Backend Development": 0.4}),
    "Ruby": ("Languages", [], {"Backend Development": 0.4}),
    "R": ("Languages", [], {"Data Science": 0.6}),
    "Scala": ("Languages", [], {"Data Science": 0.3, "Backend Development": 0.3}),
    "SQL": ("Languages", [], {"Data Science": 0.6, "Backend Development": 0.4}),
    "Bash": ("Languages", [], {"DevOps & Cloud": 0.4}),
    "MATLAB": ("Languages", [], {"Data Science": 0.3}),

    # Frontend
    "React": ("Frontend", ["React.js", "ReactJS"], {"Frontend Development": 0.9, "Full Stack Development": 0.7}),
    "Vue": ("Frontend", ["Vue.js"], {"Frontend Development": 0.8}),
    "Angular": ("Frontend", [], {"Frontend Development": 0.8}),
    "Next.js": ("Frontend", ["NextJS"], {"Frontend Development": 0.7, "Full Stack Development": 0.6}),
    "Redux": ("Frontend", [], {"Frontend Development": 0.5}),
    "HTML": ("Frontend", ["HTML5"], {"Frontend Development": 0.6}),
    "CSS": ("Frontend", ["CSS3"], {"Frontend Development": 0.6}),
    "Tailwind CSS": ("Frontend", ["Tailwind"], {"Frontend Development": 0.5}),
    "Bootstrap": ("Frontend", [], {"Frontend Development": 0.4}),
    "Vite": ("Frontend", [], {"Frontend Development": 0.3}),

    # Backend
    "Node.js": ("Backend", ["NodeJS"], {"Backend Development": 0.7, "Full Stack Development": 0.6}),
    "Express": ("Backend", ["Express.js"], {"Backend Development": 0.6}),
    "FastAPI": ("Backend", [], {"Backend Development": 0.8, "Machine Learning Engineering": 0.4}),
    "Django": ("Backend", [], {"Backend Development": 0.7}),
    "Flask": ("Backend", [], {"Backend Development": 0.6}),
    "Spring Boot": ("Backend", ["Spring"], {"Backend Development": 0.7}),
    "REST API": ("Backend", ["RESTful API"], {"Backend Development": 0.6, "Full Stack Development": 0.4}),
    "GraphQL": ("Backend", [], {"Backend Development": 0.4, "Frontend Development": 0.2}),
    "Microservices": ("Backend", [], {"Backend Development": 0.5, "DevOps & Cloud": 0.3}),

    # Databases
    "MongoDB": ("Databases", [], {"Backend Development": 0.5, "Full Stack Development": 0.4}),
    "PostgreSQL": ("Databases", [], {"Backend Development": 0.6, "Data Science": 0.3}),
    "MySQL": ("Databases", [], {"Backend Development": 0.5}),
    "SQLite": ("Databases", [], {"Backend Development": 0.3}),
    "Redis": ("Databases", [], {"Backend Development": 0.4, "DevOps & Cloud": 0.3}),

    # Cloud & DevOps
    "AWS": ("Cloud & DevOps", ["Amazon Web Services"], {"DevOps & Cloud": 0.8, "Backend Development": 0.3}),
    "Azure": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.7}),
    "GCP": ("Cloud & DevOps", ["Google Cloud"], {"DevOps & Cloud": 0.7}),
    "Docker": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.8, "Backend Development": 0.3, "Machine Learning Engineering": 0.4}),
    "Kubernetes": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.9}),
    "Jenkins": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.6}),
    "CI/CD": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.7, "QA & Testing": 0.3}),
    "Terraform": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.7}),
    "GitHub Actions": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.5}),
    "Linux": ("Cloud & DevOps", [], {"DevOps & Cloud": 0.5}),

    # AI & ML
    "Machine Learning": ("AI & ML", [], {"Machine Learning Engineering": 0.9, "Data Science": 0.8}),
    "Deep Learning": ("AI & ML", [], {"Machine Learning Engineering": 0.8, "Data Science": 0.5}),
    "TensorFlow": ("AI & ML", [], {"Machine Learning Engineering": 0.7, "Data Science": 0.4}),
    "PyTorch": ("AI & ML", [], {"Machine Learning Engineering": 0.7, "Data Science": 0.4}),
    "scikit-learn": ("AI & ML", ["sklearn"], {"Data Science": 0.7, "Machine Learning Engineering": 0.5}),
    "NLP": ("AI & ML", ["Natural Language Processing"], {"Machine Learning Engineering": 0.6, "Data Science": 0.5}),
    "Computer Vision": ("AI & ML", [], {"Machine Learning Engineering": 0.6}),
    "Pandas": ("AI & ML", [], {"Data Science": 0.8}),
    "NumPy": ("AI & ML", [], {"Data Science": 0.6}),
    "spaCy": ("AI & ML", [], {"Machine Learning Engineering": 0.5, "Data Science": 0.3}),
    "Sentence Transformers": ("AI & ML", [], {"Machine Learning Engineering": 0.5}),
    "LangChain": ("AI & ML", [], {"Machine Learning Engineering": 0.4}),

    # Tools
    "Git": ("Tools", [], {}),
    "GitHub": ("Tools", [], {}),
    "Postman": ("Tools", [], {"Backend Development": 0.2, "QA & Testing": 0.3}),
    "Figma": ("Tools", [], {"Frontend Development": 0.2}),
    "Jira": ("Tools", [], {}),

    # Concepts
    "Data Structures": ("Concepts", ["Data Structures and Algorithms", "DSA"], {}),
    "Algorithms": ("Concepts", [], {}),
    "System Design": ("Concepts", [], {"Backend Development": 0.3}),
    "OOP": ("Concepts", ["Object-Oriented Programming"], {}),
    "Design Patterns": ("Concepts", [], {}),
    "Agile": ("Concepts", [], {}),
    "TDD": ("Concepts", ["Test-Driven Development"], {"QA & Testing": 0.4}),
    "Unit Testing": ("Concepts", [], {"QA & Testing": 0.5}),
    "JWT": ("Concepts", [], {"Backend Development": 0.3}),
    "OAuth": ("Concepts", [], {"Backend Development": 0.3}),
    "Selenium": ("Concepts", [], {"QA & Testing": 0.7}),

    # Mobile
    "React Native": ("Mobile", [], {"Mobile Development": 0.8}),
    "Flutter": ("Mobile", [], {"Mobile Development": 0.8}),
    "Android SDK": ("Mobile", [], {"Mobile Development": 0.6}),

    # Soft Skills
    "Communication": ("Soft Skills", [], {}),
    "Leadership": ("Soft Skills", [], {}),
    "Teamwork": ("Soft Skills", [], {}),
    "Problem Solving": ("Soft Skills", [], {}),
    "Project Management": ("Soft Skills", [], {}),
}
