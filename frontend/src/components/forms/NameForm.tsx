import { useState } from 'react'
import { TextField } from '../ui/TextField'
import { Button } from '../ui/Button'
import type { FormEvent } from 'react'

interface Errors {
  firstName?: string
  lastName?: string
}

interface NameFormProps {
  onSubmit: (firstName: string, lastName: string) => Promise<void>
}

export const NameForm: React.FC<NameFormProps> = ({ onSubmit }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): Errors => {
    const newErrors: Errors = {}
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    return newErrors
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await onSubmit(firstName, lastName)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormInvalid = !firstName.trim() || !lastName.trim() || Object.keys(validate()).length > 0

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 w-full">
      <TextField
        label="First Name"
        placeholder="Enter your first name"
        value={firstName}
        onChange={setFirstName}
        error={errors.firstName}
        disabled={isSubmitting}
      />
      <TextField
        label="Last Name"
        placeholder="Enter your last name"
        value={lastName}
        onChange={setLastName}
        error={errors.lastName}
        disabled={isSubmitting}
      />
      <Button
        label={isSubmitting ? 'Submitting...' : 'Submit'}
        variant="primary"
        buttonClass="text-center mt-4"
        disabled={isSubmitting || isFormInvalid}
      />
    </form>
  )
}

export default NameForm
