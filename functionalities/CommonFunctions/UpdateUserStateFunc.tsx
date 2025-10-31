interface iUpdateUserState {
    UserState: any;
    keyPath: string;     // Ruta en formato 'Digital.Cookies' o 'User.FirstName'
    updatedValue: any;   // El nuevo valor que deseas establecer
    replace?: boolean;   // Opcional: true para fusionar con el valor existente, false para sobrescribir (por defecto: false)
}
  
export default function UpdateUserState ({UserState, keyPath, updatedValue, replace = false }: iUpdateUserState){
    const keys = keyPath.split('.'); // Dividimos la ruta de clave en niveles
    const lastKey = keys.pop();   // Obtenemos el último nivel para actualizar el valor
    // Clonamos el objeto original para no mutar directamente
    const deepClone = { ...UserState };
    let currentLevel = deepClone;
    keys.forEach((key) => {
        if (!currentLevel[key]) {
        currentLevel[key] = {}; // Inicializamos si no existe
        }
        currentLevel = currentLevel[key];
    });
    // Si la última clave existe y `merge` está activado, fusionamos el contenido existente
    if (lastKey) {
        if (replace || typeof updatedValue !== 'object' || Array.isArray(updatedValue)) {
            currentLevel[lastKey] = updatedValue; // Reemplazar completamente el valor
          } else {
            // Si el valor es un objeto y no se debe reemplazar, hacer una fusión profunda
            currentLevel[lastKey] = { ...currentLevel[lastKey], ...updatedValue };
          }
        }
    // console.log(deepClone)
    return deepClone;
};
