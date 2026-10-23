import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import { supabase, IS_MOCK } from "../supabaseClient";

const AuthContext = createContext({});

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // Used to prevent an old async loadProfile()
  // from restoring an old user/role after logout.
  const requestId = useRef(0);


  async function loadProfile(authUser) {

    const currentRequest = ++requestId.current;

    // No authenticated user
    if (!authUser) {

      setUser(null);
      setRole(null);
      setTeacher(null);
      setLoading(false);

      return;
    }

    setUser(authUser);

    let userRole = null;


    // =========================
    // GET USER ROLE
    // =========================

    if (IS_MOCK) {

      userRole = supabase._getMockUserRole(authUser.id);

    } else {

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .maybeSingle();

      userRole = roleRow?.role ?? null;
    }


    // IMPORTANT:
    // If logout/login happened while the query
    // was running, ignore this old result.
    if (currentRequest !== requestId.current) {
      return;
    }

    setRole(userRole);


    // =========================
    // LOAD TEACHER PROFILE
    // =========================

    if (userRole === "teacher") {

      let teacherRow = null;

      if (IS_MOCK) {

        const teacherId =
          supabase._getMockTeacherId(authUser.id);

        const { data } = await supabase
          .from("teachers")
          .select("*, departments(name)")
          .eq("id", teacherId)
          .maybeSingle();

        teacherRow = data;

      } else {

        const { data } = await supabase
          .from("teachers")
          .select("*, departments(name)")
          .eq("user_id", authUser.id)
          .maybeSingle();

        teacherRow = data;
      }

      // Again, ignore old request if logout happened.
      if (currentRequest !== requestId.current) {
        return;
      }

      setTeacher(teacherRow);

    } else {

      setTeacher(null);
    }


    if (currentRequest === requestId.current) {
      setLoading(false);
    }
  }


  // =========================
  // AUTH STATE LISTENER
  // =========================

  useEffect(() => {

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {

        loadProfile(session?.user ?? null);

      });


    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        loadProfile(session?.user ?? null);

      }
    );


    return () => {
      subscription.unsubscribe();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // =========================
  // LOGIN
  // =========================

  async function login(email, password) {

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    return data;
  }


  // =========================
  // LOGOUT
  // =========================

  async function logout() {

    // Invalidate every old loadProfile request.
    requestId.current++;

    // Immediately clear application state.
    setUser(null);
    setRole(null);
    setTeacher(null);
    setLoading(false);

    // Then remove Supabase session.
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        teacher,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}