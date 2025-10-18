/*
 * This component represents the navbar that will consistently visible as users
 * navigate the application. As you are building out this component, keep in
 * mind that we want it to be reusable across different pages in the
 * application. Do you need any props?
 */


// Import your image components
import { AdminButton, EducationButton, HousingButton, OverviewButton, ReportButton, SchoolButton } from "./icons";

// Color palette constants
const SOFT_PINK = "bg-[#F38EFF]";
const LIGHT_GRAY = "bg-[#F5F5F5]";
const DARK_GRAY = "bg-[#555555]"

const TAB_CONFIG = [
    { name: "Overview", Icon: OverviewButton },
    { name: "Housing", Icon: HousingButton },
    { name: "Education", Icon: EducationButton },
    { name: "Schools", Icon: SchoolButton },
    { name: "Reports", Icon: ReportButton },
    { name: "Admin", Icon: AdminButton },
];

export default function Navbar() {
  const [selected, setSelected] = useState("Overview");
  const [hovered, setHovered] = useState("");

  return (
    <nav className={`w-[280px] min-h-screen ${DARK_GRAY} text-white flex flex-col`}>
      {/* Logo Area */}
      <div className="flex flex-col items-start px-6 py-6 border-b border-[#F5F5F5]">
        <img src="./boston_logo.png" alt="Boston Higher Ground logo" className="w-[120px] mb-2" />
        <div className="font-semibold text-lg">Boston Higher Ground</div>
        <div className="text-xs text-[#F5F5F5] font-normal">Internal Dashboard</div>
      </div>

      {/* Spacer */}
      <div className="h-4" />

      <ul className="flex flex-col gap-2 px-0">
        {TAB_CONFIG.map(({ name, Icon }) => {
          const isSelected = selected === name;
          return (
            <li
              key={name}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered("")}
              onClick={() => setSelected(name)}
              className="px-0"
            >
              <div
                className={[
                  "flex items-center px-5 py-2.5 rounded-xl transition-colors cursor-pointer",
                  isSelected
                    ? SOFT_PINK + " text-white font-semibold shadow"
                    : hovered === name
                    ? LIGHT_GRAY + " text-white"
                    : "text-white"
                ].join(" ")}
              >
                <Icon className="w-6 h-6 mr-4" />
                <span className="text-base">{name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
