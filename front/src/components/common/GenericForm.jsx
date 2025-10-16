import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GenericForm = ({ defaultValues, onSubmit, isEditMode, schema, fields, modelName }) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (defaultValues) {
      for (const key in defaultValues) {
        setValue(key, defaultValues[key]);
      }
    }
  }, [defaultValues, setValue]);

  const renderField = (field) => {
    switch (field.type) {
      case "select":
        return (
          <div className="form-control" key={field.name}>
            <label className="label">
              <span className="label-text">{field.label}</span>
            </label>
            <select {...register(field.name)} className="select select-bordered w-full">
              <option value="">{field.placeholder || "Sélectionner"}</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors[field.name] && (
              <span className="text-error text-sm mt-1">{errors[field.name].message}</span>
            )}
          </div>
        );
      case "textarea":
        return (
          <div className="form-control" key={field.name}>
            <label className="label">
              <span className="label-text">{field.label}</span>
            </label>
            <textarea
              {...register(field.name)}
              className="textarea textarea-bordered h-24"
            ></textarea>
            {errors[field.name] && (
              <span className="text-error text-sm mt-1">{errors[field.name].message}</span>
            )}
          </div>
        );
      default:
        return (
          <div className="form-control" key={field.name}>
            <label className="label">
              <span className="label-text">{field.label}</span>
            </label>
            <input
              type={field.type}
              {...register(field.name)}
              className="input input-bordered"
            />
            {errors[field.name] && (
              <span className="text-error text-sm mt-1">{errors[field.name].message}</span>
            )}
          </div>
        );
    }
  };

  return (
    <div className="card shadow-xl bg-base-100 m-10">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6">
          {isEditMode ? `Modification d'un ${modelName}` : `Enregistrement d'un ${modelName}`}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field) => renderField(field))}
          </div>
          <div className="card-actions justify-end mt-6">
            <button
              type="button"
              onClick={() => (isEditMode ? navigate(`/${modelName}`) : reset())}
              className="btn btn-outline"
            >
              {isEditMode ? "Annuler" : "Réinitialiser"}
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenericForm;